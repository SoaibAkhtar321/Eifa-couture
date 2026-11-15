/* ============================================
   EIFA COUTURE — Auto-refund for payments on cancelled orders
   ============================================
   Server-only. When mark_order_paid() reports `cancelled_order_paid`
   (money arrived for an order the customer/admin had already
   cancelled), the order stays cancelled and this refunds the full
   amount. Same pattern as the cancel route:
   initiate_refund -> Razorpay -> finalize_refund.
   Never throws: if the refund fails the order timeline says a manual
   refund is needed, and admins already got an alert.
   ============================================ */

import { randomUUID } from 'crypto';

import { createRazorpayRefund } from '@/lib/razorpay';
import { createServiceClient } from '@/lib/supabase/service';

export async function refundPaymentOnCancelledOrder(params: {
  orderId: string;
  orderNumber: string;
}): Promise<'initiated' | 'pending_manual'> {
  const service = createServiceClient();
  const idempotencyKey = randomUUID();

  const note = (notes: string) =>
    service.from('order_status_history').insert({
      order_id: params.orderId,
      event_type: 'payment_refunded',
      previous_status: null,
      new_status: null,
      actor_type: 'system',
      notes,
    });

  try {
    const { data: order } = await service
      .from('orders')
      .select('total')
      .eq('id', params.orderId)
      .single<{ total: number }>();
    if (!order) throw new Error('Order not found.');

    const amount = Number(order.total);

    const { data: initiated, error: initiateError } = await service.rpc('initiate_refund', {
      p_order_id: params.orderId,
      p_amount: amount,
      p_reason: 'Payment received after order was cancelled',
      p_idempotency_key: idempotencyKey,
      p_initiated_by: null,
    });
    if (initiateError || !initiated) {
      throw new Error(initiateError?.message ?? 'initiate_refund returned nothing');
    }

    const { refund_id: refundId, razorpay_payment_id: paymentId } = initiated as {
      refund_id: string;
      razorpay_payment_id: string;
    };

    try {
      const result = await createRazorpayRefund({
        razorpayPaymentId: paymentId,
        amountInPaise: Math.round(amount * 100),
        idempotencyKey,
        notes: {
          internal_order_id: params.orderId,
          order_number: params.orderNumber,
          refund_id: refundId,
          source: 'payment_after_cancel',
        },
      });
      await service.rpc('finalize_refund', {
        p_refund_id: refundId,
        p_status: 'processed',
        p_razorpay_refund_id: result.razorpayRefundId,
        p_error_message: null,
      });
    } catch (err) {
      await service.rpc('finalize_refund', {
        p_refund_id: refundId,
        p_status: 'failed',
        p_razorpay_refund_id: null,
        p_error_message: err instanceof Error ? err.message : 'Razorpay refund request failed.',
      });
      throw err;
    }

    await note(`Refund of ₹${amount.toFixed(2)} initiated for a payment received after cancellation.`);
    return 'initiated';
  } catch (err) {
    console.error('[refund-cancelled-payment] failed for', params.orderNumber, err);
    await note(
      'Automatic refund failed for a payment received after cancellation — needs manual refund from the Refund panel.'
    );
    return 'pending_manual';
  }
}
