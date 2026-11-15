/* ============================================
   EIFA COUTURE — Cloudflare Turnstile (browser)
   ============================================
   Guest checkout calls getTurnstileToken() before creating the anonymous
   session. With NEXT_PUBLIC_TURNSTILE_SITE_KEY unset it returns null and
   nothing changes, so the code can ship before the CAPTCHA is switched on.

   The widget is "interaction-only": invisible for normal shoppers, and it
   shows a small check at the bottom of the screen only when Cloudflare
   needs one. The token is single use; the server forwards it to Supabase,
   which verifies it.
   ============================================ */

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      appearance?: 'always' | 'execute' | 'interaction-only';
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'timeout-callback'?: () => void;
    }
  ) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = SCRIPT_SRC;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile_script_failed'));
    };
    document.head.appendChild(tag);
  });
  return scriptPromise;
}

/** Returns a one-time token, null when Turnstile is not configured, or throws on failure. */
export async function getTurnstileToken(timeoutMs = 20_000): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey || typeof window === 'undefined') return null;

  await loadScript();
  const api = window.turnstile;
  if (!api) throw new Error('turnstile_unavailable');

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000';
  document.body.appendChild(host);

  return new Promise<string>((resolve, reject) => {
    let widgetId = '';
    const finish = (fn: () => void) => {
      clearTimeout(timer);
      try {
        if (widgetId) api.remove(widgetId);
      } catch {
        /* widget already gone */
      }
      host.remove();
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('turnstile_timeout'))), timeoutMs);
    widgetId = api.render(host, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      callback: (token) => finish(() => resolve(token)),
      'error-callback': () => finish(() => reject(new Error('turnstile_error'))),
      'timeout-callback': () => finish(() => reject(new Error('turnstile_timeout'))),
    });
  });
}
