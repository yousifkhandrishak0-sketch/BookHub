export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function discountPercent(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
  return pct > 0 ? pct : null;
}

export const DELIVERY_FREE_THRESHOLD = 3500;
export const STANDARD_DELIVERY_FEE = 250;

export function getDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}
