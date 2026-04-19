/**
 * Lightweight device fingerprinting (no external libs).
 * Generates a stable per-browser device ID from UA + screen + timezone + language.
 */

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    return `macOS ${m?.[1].replace(/_/g, '.') ?? ''}`.trim();
  }
  if (/Android ([\d.]+)/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    return `Android ${m?.[1] ?? ''}`.trim();
  }
  if (/iPhone OS ([\d_]+)/.test(ua)) {
    const m = ua.match(/iPhone OS ([\d_]+)/);
    return `iOS ${m?.[1].replace(/_/g, '.') ?? ''}`.trim();
  }
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function detectBrowser(ua: string): string {
  if (/Edg\/([\d.]+)/.test(ua)) return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1]}`;
  if (/Chrome\/([\d.]+)/.test(ua)) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1]}`;
  if (/Firefox\/([\d.]+)/.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1]}`;
  if (/Version\/([\d.]+).*Safari/.test(ua)) return `Safari ${ua.match(/Version\/([\d.]+)/)?.[1]}`;
  return 'Unknown Browser';
}

export interface DeviceFingerprint {
  deviceId: string;
  os: string;
  browser: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export async function getDeviceFingerprint(): Promise<DeviceFingerprint> {
  const ua = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const lang = navigator.language || 'unknown';
  const seed = `${ua}|${screenRes}|${tz}|${lang}|${navigator.hardwareConcurrency ?? 0}`;
  const hash = await sha256Hex(seed);
  return {
    deviceId: hash.substring(0, 32),
    os: detectOS(ua),
    browser: detectBrowser(ua),
    userAgent: ua,
    screenResolution: screenRes,
    timezone: tz,
    language: lang,
  };
}

/** Best-effort client IP (uses public service; falls back to 'unknown'). */
export async function getClientIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const json = await res.json();
    return json.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}
