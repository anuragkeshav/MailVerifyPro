import { smtpVerify, SmtpResponse } from './smtp.js';

const DEFAULT_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 45000];

/**
 * Handles greylisting by retrying the SMTP verification with exponential backoff.
 * @param email The email address to verify.
 * @param mxHost The MX host to connect to.
 * @param maxRetries The maximum number of retry attempts.
 * @returns A promise resolving to the final SmtpResponse.
 */
export async function handleGreylisting(
  email: string, 
  mxHost: string, 
  maxRetries: number = DEFAULT_RETRIES
): Promise<SmtpResponse> {
  let attempt = 0;
  let lastResponse: SmtpResponse | null = null;

  while (attempt <= maxRetries) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const response = await smtpVerify(email, mxHost);
    lastResponse = response;

    // Check for 4xx temporary failure codes (often used for greylisting)
    if (response.code >= 400 && response.code < 500) {
      attempt++;
      continue;
    }

    // If it's not a 4xx code, we have a definitive answer, return immediately
    return response;
  }

  // If we exhausted retries and still have 4xx, return the last response
  return lastResponse!;
}
