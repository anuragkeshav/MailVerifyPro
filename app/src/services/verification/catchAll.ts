import { smtpVerify } from './smtp.js';

const catchAllCache = new Map<string, boolean>();

/**
 * Checks if a domain is configured as a catch-all by testing random email addresses.
 * @param domain The domain to test.
 * @param mxHost The MX host for the domain.
 * @returns A promise resolving to an object indicating if the domain is a catch-all.
 */
export async function checkCatchAll(domain: string, mxHost: string): Promise<{ isCatchAll: boolean }> {
  const normalizedDomain = domain.toLowerCase();
  
  if (catchAllCache.has(normalizedDomain)) {
    return { isCatchAll: catchAllCache.get(normalizedDomain)! };
  }

  const generateRandomStr = (length: number) => {
    return Math.random().toString(36).substring(2, 2 + length);
  };

  const testEmails = [
    `${generateRandomStr(12)}@${normalizedDomain}`,
    `${Math.floor(Math.random() * 1000000000)}@${normalizedDomain}`,
    `verify-${generateRandomStr(8)}@${normalizedDomain}`
  ];

  let allAccepted = true;

  for (const email of testEmails) {
    try {
      const response = await smtpVerify(email, mxHost, 10000);
      if (!response.accepted) {
        allAccepted = false;
        break;
      }
    } catch (error) {
      allAccepted = false;
      break;
    }
  }

  catchAllCache.set(normalizedDomain, allAccepted);
  return { isCatchAll: allAccepted };
}

/**
 * Gets the cached catch-all status for a domain.
 * @param domain The domain to check in cache.
 * @returns The cached boolean status or undefined.
 */
export function getCachedCatchAll(domain: string): boolean | undefined {
  return catchAllCache.get(domain.toLowerCase());
}

/**
 * Clears the catch-all cache.
 */
export function clearCatchAllCache(): void {
  catchAllCache.clear();
}
