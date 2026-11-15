/* Shared error mapping for the `request_return` RPC (see migration
   20261114160000). Used by the signed-in route and the guest route. */

export const REQUEST_RETURN_ERRORS: Record<string, { status: number; message: string }> = {
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

export function mapRequestReturnError(message: string): { status: number; message: string } {
  for (const [code, mapped] of Object.entries(REQUEST_RETURN_ERRORS)) {
    if (message.includes(code)) return mapped;
  }
  return { status: 500, message: 'Could not submit your request. Please try again.' };
}
