export function trackingHref(orderId: string, productId: string) {
  return `/orders/${encodeURIComponent(orderId)}/track/${encodeURIComponent(productId)}`;
}
