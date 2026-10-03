/**
 * Hardens the client environment against DevTools inspection and hotkey leakage:
 * 1. Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U.
 * 2. Blocks context menu (Inspect Element).
 * 3. Suppresses verbose console methods in production.
 */
export function initClientSecurity() {
  if (typeof window === 'undefined') return;

  // Block shortcut keys
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const key = (e.key || '').toUpperCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (
        key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
        (isCtrlOrMeta && key === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  // Block right-click Inspect Element
  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      e.preventDefault();
      return false;
    },
    true
  );

  // Suppress sensitive console outputs in production builds
  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
  }
}
