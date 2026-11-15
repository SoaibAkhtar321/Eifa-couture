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
import { mapRequestReturnError as mapRpcError } from '@/lib/returns/request-errors';
import { createServiceClient } from '@/lib/supabase/service';

const bodySchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  reason: z.string().trim().min(1).max(200),
  details: z.string().trim().max(1000).optional(),
  isExchange: z.boolean().optional(),
  exchangeSize: z.string().trim().max(20).optional(),
});

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

  const limit = await rateLimit(`order-return:${user.id}`, RATE_LIMITS.returnRequest);
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
