/* ============================================
   EIFA COUTURE — FAQ content (single source)
   ============================================
   Every answer restates a rule that is already published on the
   Shipping, Returns & Refunds, Terms or Privacy pages. Numbers come
   from getPolicyValues() so the FAQ can never disagree with the
   live settings. Answers are plain text so the same strings can be
   shown on the page and emitted as FAQPage structured data.
   ============================================ */

import { CONTACT_INFO, RETURN_POLICY } from '@/lib/constants';
import type { PolicyValues } from '@/lib/policy';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  heading: string;
  items: FaqItem[];
}

export function buildFaqGroups(policy: PolicyValues): FaqGroup[] {
  const { returnWindowDays: windowDays, refundDays, deliveryDays } = policy;
  const { address } = CONTACT_INFO;

  return [
    {
      heading: 'Ordering and payment',
      items: [
        {
          q: 'Do I need an account to place an order?',
          a: 'No. You can check out as a guest with your name, email, phone number and delivery address. An account is optional; it lets you save addresses and see your orders in My Account.',
        },
        {
          q: 'How do I pay?',
          a: 'All orders are paid in advance, online, through Razorpay. We do not offer cash on delivery.',
        },
        {
          q: 'Are the pieces really hand-embroidered?',
          a: 'Yes. Eifa Couture sells handcrafted Lucknowi Chikankari, hand-embroidered by master karigars in Lucknow. Small variations in thread work, shade and finish are part of handwork and are not defects.',
        },
      ],
    },
    {
      heading: 'Delivery',
      items: [
        {
          q: 'How long does delivery take?',
          a: `Standard delivery usually takes ${deliveryDays.min}–${deliveryDays.max} working days from the date you place the order. This is an estimate, not a guarantee: remote areas, festivals, weather and courier delays can add time.`,
        },
        {
          q: 'Is there a delivery charge?',
          a: 'No. Delivery is free on every order, whatever the order value.',
        },
        {
          q: 'Do you deliver outside India?',
          a: 'Not at the moment. We deliver to most pin codes across India through our courier partners.',
        },
        {
          q: 'How can I track my order?',
          a: 'Open Track Order and enter your order number and the email you used at checkout, or use My Account if you have one. Once your order ships we add the courier tracking number where one is available.',
        },
      ],
    },
    {
      heading: 'Cancellations, returns and refunds',
      items: [
        {
          q: 'Can I cancel my order?',
          a: 'Yes, before it is shipped, while it shows as Order placed, Confirmed or Packing. Signed-in customers cancel from My Account, and guests from Track Order. A cancelled order is refunded in full. Once an order has shipped it cannot be cancelled, but you can request a return after it is delivered.',
        },
        {
          q: 'How long do I have to return an item?',
          a: `You can request a return within ${windowDays} days of delivery, once your order shows as Delivered.`,
        },
        {
          q: 'Do I need to send photos to request a return?',
          a: 'No. Choose the item and the reason and describe the problem in the details box. We may contact you if we need more information.',
        },
        {
          q: 'Which items can be returned?',
          a: `${RETURN_POLICY.conditions.join(' ')} Handcrafted variations in thread work, shade and finish are part of Chikankari and are not defects.`,
        },
        {
          q: 'Do I pay for the return pickup?',
          a: 'No. If your return is approved we arrange the courier pickup, and you are not charged for it. Please keep the item packed in its original packaging with the tags until it is collected.',
        },
        {
          q: 'Can I exchange a size?',
          a: `Yes. You can request an exchange for a different size of the same piece and colour within ${windowDays} days of delivery, subject to stock. If your size is not available you can request a return instead.`,
        },
        {
          q: 'When and how will I get my refund?',
          a: `We refund only after the returned item has reached us and been verified. Refunds always go to your original payment method through Razorpay. The money reaches your account ${refundDays.min}–${refundDays.max} working days after we start the refund; some banks take a few extra days to show it.`,
        },
      ],
    },
    {
      heading: 'Contact',
      items: [
        {
          q: 'How can I contact Eifa Couture?',
          a: `Email ${CONTACT_INFO.email} or call ${CONTACT_INFO.phone}. Please include your order number if your question is about an order.`,
        },
        {
          q: 'Where is Eifa Couture based?',
          a: `Eifa Couture is a family atelier in Lucknow, working with Chikankari since 1998. Registered address: ${address.line1}, ${address.line2}, India.`,
        },
      ],
    },
  ];
}
