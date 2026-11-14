/* ============================================
   EIFA COUTURE — Customer Return / Exchange Request Route
   ============================================
   POST /api/orders/[id]/return
   body: { orderItemId, quantity, reason, details?, isExchange?, exchangeSize? }

   Lets a signed-in customer ask to return or exchange an item of
   their OWN delivered order. Every rule (ownership, delivered, paid,
   return window, quantity, one open return per item, exchange size
   exists and is in stock) is enforced inside the `request_return` RPC
   (migration 20261114160000) under an order-row lock. The UI only
   decides what to show.
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { rateLimit, rateLimitResponseHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  reason: z.string().trim().min(1).max(200),
  details: z.string().trim().max(1000).optional(),
  isExchange: z.boolean().optional(),
  exchangeSize: z.string().trim().max(20).optional(),
});

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  order_not_found: { status: 404, message: 'Order not found.' },
  item_not_found: { status: 404, message: 'Item not found on this order.' },
  order_not_delivered: { status: 409, message: 'Returns can be requested once the order is delivered.' },
  order_not_paid: { status: 409, message: 'This order is not eligible for a return.' },
  return_window_closed: { status: 409, message: 'The return window for this order has closed.' },
  return_already_open: { status: 409, message: 'A return is already in progress for this item.' },
  quantity_exceeds_purchased: { status: 409, message: 'This item has already been returned or exchanged.' },
  invalid_quantity: { status: 400, message: 'Choose a valid quantity.' },
  reason_required: { status: 400, message: 'Please choose a reason.' },
  exchange_size_required: { status: 400, message: 'Choose the size you want in exchange.' },
  exchange_variant_unavailable: { status: 409, message: 'That size is not available for exchange.' },
  exchange_out_of_stock: { status: 409, message: 'That size is out of stock right now.' },
};

function mapRpcError(message: string): { status: number; message: string } {
  for (const [code, mapped] of Object.entries(ERROR_RESPONSES)) {
    if (message.includes(code)) return mapped;
  }
  return { status: 500, message: 'Could not submit your request. Please try again.' };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: { message: 'Invalid order id.' } }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { message: 'Please sign in to request a return.' } }, { status: 401 });
  }

  const limit = rateLimit(`order-return:${user.id}`, RATE_LIMITS.returnRequest);
  if (!limit.success) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Please wait a moment and try again.' } },
      { status: 429, headers: rateLimitResponseHeaders(limit.retryAfterSeconds!) }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid request.' } }, { status: 400 });
  }

  const body = parsed.data;
  const service = createServiceClient();

  const { data, error } = await service.rpc('request_return', {
    p_order_id: orderId,
    p_user_id: user.id,
    p_order_item_id: body.orderItemId,
    p_quantity: body.quantity,
    p_reason: body.reason,
    p_details: body.details ?? null,
    p_is_exchange: body.isExchange ?? false,
    p_exchange_size: body.isExchange ? (body.exchangeSize ?? null) : null,
  });

  if (error || !data) {
    const mapped = mapRpcError(error?.message ?? '');
    return NextResponse.json({ error: { message: mapped.message } }, { status: mapped.status });
  }

  const result = data as { id: string; order_number: string; status: string };

  return NextResponse.json({
    returnId: result.id,
    orderNumber: result.order_number,
    status: result.status,
  });
}
