export type StorefrontOrderStatus = 'REQUEST' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

const transitions: Record<StorefrontOrderStatus, StorefrontOrderStatus[]> = {
  REQUEST: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: []
};

export function normalizeStorefrontOrderStatus(status: unknown): StorefrontOrderStatus | null {
  if (status === 'pending') {
    return 'REQUEST';
  }
  if (status === 'REQUEST' || status === 'ACCEPTED' || status === 'REJECTED' || status === 'COMPLETED') {
    return status;
  }
  return null;
}

export function canTransitionStorefrontOrder(
  currentStatus: unknown,
  nextStatus: unknown
): nextStatus is StorefrontOrderStatus {
  const current = normalizeStorefrontOrderStatus(currentStatus);
  const next = normalizeStorefrontOrderStatus(nextStatus);
  return current !== null && next !== null && transitions[current].includes(next);
}
