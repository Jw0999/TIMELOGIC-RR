/**
 * Client security utility:
 * 1. Blocks DevTools inspection hotkeys (F12, Ctrl+Shift+I/J/C, Ctrl+U).
 * 2. Blocks right-click context menu (Inspect Element).
 * 3. Suppresses verbose console methods in production builds.
 */
export function initClientSecurity() {
  if (typeof window === 'undefined') return;

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

  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      e.preventDefault();
      return false;
    },
    true
  );

  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
  }
}
