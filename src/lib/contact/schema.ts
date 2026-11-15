/* ============================================
   EIFA COUTURE — Contact form schema (shared)
   ============================================
   One zod schema used by the browser form (instant feedback) and by
   POST /api/contact (the real check). Never trust the browser copy.
   ============================================ */

import { z } from 'zod';

export const CONTACT_ENQUIRY_TYPES = [
  'Product enquiry',
  'Size guidance',
  'Custom order',
  'Bulk / wholesale enquiry',
  'Order support',
] as const;

/** Removes control characters and collapses line breaks (used for single-line fields). */
const singleLine = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();

export const contactSchema = z.object({
  name: z.string().transform(singleLine).pipe(z.string().min(2, 'Please enter your name.').max(80)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email('Please enter a valid email address.').max(254)),
  phone: z
    .string()
    .transform(singleLine)
    .pipe(z.string().max(20).regex(/^[0-9+()\- ]*$/, 'Please enter a valid phone number.'))
    .optional()
    .default(''),
  topic: z.enum(CONTACT_ENQUIRY_TYPES),
  orderNumber: z
    .string()
    .transform(singleLine)
    .pipe(z.string().max(40).regex(/^[A-Za-z0-9-]*$/, 'Order numbers use letters, numbers and dashes only.'))
    .optional()
    .default(''),
  message: z
    .string()
    .trim()
    .pipe(z.string().min(10, 'Please write at least a few words so we can help.').max(2000)),
  consent: z.literal(true, { error: 'Please confirm you have read the Privacy Policy.' }),
  /** Honeypot. Real visitors never see or fill this. */
  website: z.string().max(200).optional().default(''),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
