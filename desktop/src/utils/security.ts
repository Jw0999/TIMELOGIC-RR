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

export function getOrCreateDesktopDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown-device';
  const STORAGE_KEY = 'timelogic_desktop_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId || deviceId.length < 10) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'device-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export function getDesktopDeviceInfo() {
  const deviceId = getOrCreateDesktopDeviceId();
  let platform = 'Desktop';
  let osDetail = 'Desktop PC';

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/Windows NT 10.0/i.test(ua)) { platform = 'Windows'; osDetail = 'Windows 10/11'; }
    else if (/Windows/i.test(ua)) { platform = 'Windows'; osDetail = 'Windows'; }
    else if (/Macintosh|Mac OS X/i.test(ua)) { platform = 'macOS'; osDetail = 'macOS'; }
    else if (/Linux/i.test(ua)) { platform = 'Linux'; osDetail = 'Linux'; }
  }

  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'x64';
  const deviceName = `${platform} Admin PC (${osDetail})`;
  const firmwareVersion = `TimeLogic Desktop v1.0.32 (${osDetail} / ${cores})`;

  return {
    deviceId,
    deviceName,
    platform,
    firmwareVersion,
    deviceType: 'DESKTOP_ADMIN',
  };
}
