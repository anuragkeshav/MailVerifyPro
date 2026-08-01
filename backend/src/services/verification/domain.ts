import dns from 'dns';

export interface DomainInfo {
  domain: string;
  hasMx: boolean;
  mxRecords: Array<{ exchange: string; priority: number }>;
  cached: boolean;
}

const domainCache = new Map<string, DomainInfo>();

/**
 * Validates a domain by checking its MX records, with a fallback to A records.
 * @param domain The domain to validate.
 * @returns A promise resolving to the DomainInfo.
 */
export async function validateDomain(domain: string): Promise<DomainInfo> {
  const normalizedDomain = domain.toLowerCase();

  if (domainCache.has(normalizedDomain)) {
    const cached = domainCache.get(normalizedDomain)!;
    return { ...cached, cached: true };
  }

  const result: DomainInfo = {
    domain: normalizedDomain,
    hasMx: false,
    mxRecords: [],
    cached: false
  };

  try {
    const mxRecords = await dns.promises.resolveMx(normalizedDomain);
    if (mxRecords && mxRecords.length > 0) {
      result.hasMx = true;
      result.mxRecords = mxRecords.sort((a, b) => a.priority - b.priority);
    } else {
      throw new Error('ENODATA');
    }
  } catch (error: any) {
    // If no MX records, try A record fallback per RFC guidelines
    try {
      const aRecords = await dns.promises.resolve4(normalizedDomain);
      if (aRecords && aRecords.length > 0) {
        result.hasMx = true;
        // The domain itself acts as the MX exchanger with priority 0
        result.mxRecords = [{ exchange: normalizedDomain, priority: 0 }];
      }
    } catch (fallbackError) {
      // Both MX and A record lookups failed
      result.hasMx = false;
    }
  }

  domainCache.set(normalizedDomain, result);
  return result;
}

/**
 * Retrieves the cached domain information if available.
 * @param domain The domain to lookup in the cache.
 * @returns The cached DomainInfo or undefined.
 */
export function getCachedDomainInfo(domain: string): DomainInfo | undefined {
  return domainCache.get(domain.toLowerCase());
}

/**
 * Clears the domain validation cache.
 */
export function clearDomainCache(): void {
  domainCache.clear();
}
