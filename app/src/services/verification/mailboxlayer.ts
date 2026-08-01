import { config } from '../../config/index.js';

interface MailboxlayerResult {
  formatValid: boolean;
  mxFound: boolean;
  smtpCheck: boolean;
  catchAll: boolean;
  role: boolean;
  disposable: boolean;
  didYouMean: string;
  score: number | null;
}

let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestStartedAt = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    const wait = Math.max(0, lastRequestStartedAt + config.MAILBOXLAYER_REQUEST_INTERVAL_MS - Date.now());
    if (wait) await delay(wait);
    lastRequestStartedAt = Date.now();
    return task();
  });
  requestQueue = run.catch(() => undefined);
  return run;
}

/** Uses managed verification when a host blocks direct SMTP, including Render Free. */
export async function verifyWithMailboxlayer(email: string): Promise<MailboxlayerResult> {
  if (!config.MAILBOXLAYER_API_KEY) {
    throw new Error('MAILBOXLAYER_API_KEY is not configured');
  }

  const url = new URL('https://apilayer.net/api/check');
  url.searchParams.set('access_key', config.MAILBOXLAYER_API_KEY);
  url.searchParams.set('email', email);

  return schedule(async () => {
    for (let attempt = 0; attempt <= config.MAILBOXLAYER_MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.VERIFICATION_API_TIMEOUT);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
        if (response.status === 429 && attempt < config.MAILBOXLAYER_MAX_RETRIES) {
          const retryAfter = Number(response.headers.get('retry-after'));
          await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000 * (attempt + 1));
          continue;
        }
        if (!response.ok) throw new Error(`Verification API returned HTTP ${response.status}`);
        const data = await response.json() as any;
        if (data?.success === false || data?.error) throw new Error(data.error?.info || data.error?.message || 'Verification API request failed');
        return {
          formatValid: data.format_valid === true,
          mxFound: data.mx_found === true,
          smtpCheck: data.smtp_check === true,
          catchAll: data.catch_all === true,
          role: data.role === true,
          disposable: data.disposable === true,
          didYouMean: typeof data.did_you_mean === 'string' ? data.did_you_mean : '',
          score: Number.isFinite(Number(data.score)) ? Number(data.score) : null,
        };
      } catch (error: any) {
        if (error?.name === 'AbortError') throw new Error('Verification API timed out');
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('Verification API rate limit exceeded');
  });
}
