/* Pure types for the admin returns panel (no runtime imports, so Client
   Components can import them without pulling in next/headers). */

import type { ReturnStatus } from '@/types/database';

export interface AdminReturnRecord {
  id: string;
  status: ReturnStatus;
  reason: string;
  details: string | null;
  quantity: number;
  isExchange: boolean;
  exchangeSize: string | null;
  adminNotes: string | null;
  refundAmount: number | null;
  requestedAt: string;
  resolvedAt: string | null;
  itemName: string;
  itemSize: string;
  itemColor: string;
}
