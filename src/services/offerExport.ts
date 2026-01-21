// Simple Offer export helper: opens the public offer in print mode
// This relies on `PublicOfferView` to auto-trigger print when `?print=1` is present

export function openOfferPrintWindow(offerId: string): void {
  const url = `${window.location.origin}/offer/public/${offerId}?print=1`;
  window.open(url, '_blank');
}
