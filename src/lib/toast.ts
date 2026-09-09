// Minimal toast utility — no dependencies, no library
// Fires a custom DOM event that the ToastContainer listens to

export function addToast(message: string, type: 'success' | 'info' = 'success') {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('rio:toast', { detail: { message, type } });
  window.dispatchEvent(event);
}
