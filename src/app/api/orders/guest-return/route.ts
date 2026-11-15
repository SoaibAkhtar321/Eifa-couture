/* ============================================
   EIFA COUTURE — Guest return / exchange request
   ============================================
   POST /api/orders/guest-return
   body: { orderNumber, email, orderItemId, quantity, reason,
           details?, isExchange?, exchangeSize? }

   For a guest on a different device than the one that placed the
   order. Access is re-verified on EVERY request (order number + email,
   guest orders only, rate-limited, generic failure), then the same
   `request_return` RPC as the signed-in route enforces every rule
   (delivered, paid, window, quantity, one open return per item).
   ============================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  findGuestOrder,
  guestCredentialsSchema,
  guestNotFound,
  guestRateLimited,
} from '@/lib/returns/guest-order-access';
import { mapRequestReturnError } from '@/lib/returns/request-errors';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  reason: z.string().trim().min(1).max(200),
  details: z.string().trim().max(1000).optional(),
  isExchange: z.boolean().optional(),
  exchangeSize: z.string().trim().max(20).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);

  const credentials = guestCredentialsSchema.safeParse(json);
  if (!credentials.success) return guestNotFound();

  const blocked = await guestRateLimited(request, credentials.data.orderNumber, 'guest-return');
  if (blocked) return blocked;

  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: { message: 'Invalid request.' } }, { status: 400 });
  }

  const order = await findGuestOrder(credentials.data);
  if (!order) return guestNotFound();

  const service = createServiceClient();
  const { data, error } = await service.rpc('request_return', {
    p_order_id: order.id,
    p_user_id: order.user_id,
    p_order_item_id: body.data.orderItemId,
    p_quantity: body.data.quantity,
    p_reason: body.data.reason,
    p_details: body.data.details ?? null,
    p_is_exchange: body.data.isExchange ?? false,
    p_exchange_size: body.data.isExchange ? (body.data.exchangeSize ?? null) : null,
  });

  if (error || !data) {
    const mapped = mapRequestReturnError(error?.message ?? '');
    return NextResponse.json({ error: { message: mapped.message } }, { status: mapped.status });
  }

  const result = data as { id: string; order_number: string; status: string };
  return NextResponse.json({ returnId: result.id, orderNumber: result.order_number, status: result.status });
}
