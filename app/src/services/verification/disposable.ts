import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let disposableDomains = new Set<string>();

try {
  // Use fileURLToPath to support standard ES Modules __dirname equivalent
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dataPath = path.resolve(__dirname, '../../../../data/disposable-domains.json');
  
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (Array.isArray(data)) {
      disposableDomains = new Set(data.map(d => d.toLowerCase()));
    }
  }
} catch (error) {
  console.warn('Could not load disposable domains list:', error);
}

/**
 * Checks if a domain is a known disposable email provider or matches common disposable patterns.
 * @param domain The domain to check.
 * @returns An object indicating whether the domain is disposable.
 */
export function checkDisposable(domain: string): { isDisposable: boolean } {
  const normalizedDomain = domain.toLowerCase();
  
  if (disposableDomains.has(normalizedDomain)) {
    return { isDisposable: true };
  }

  const commonPatterns = ['temp', 'trash', 'fake', 'disposable', 'throwaway'];
  for (const pattern of commonPatterns) {
    if (normalizedDomain.includes(pattern)) {
      return { isDisposable: true };
    }
  }

  return { isDisposable: false };
}
