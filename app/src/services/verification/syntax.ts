/**
 * Validates the syntax of an email address according to RFC 5322 guidelines.
 * @param email The email address to validate.
 * @returns An object containing the validation result and a reason if invalid.
 */
export function validateSyntax(email: string): { valid: boolean; reason: string } {
  if (!email) {
    return { valid: false, reason: 'Email is empty' };
  }

  if (email.length > 254) {
    return { valid: false, reason: 'Email exceeds maximum length of 254 characters' };
  }

  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return { valid: false, reason: 'Email is missing @ symbol' };
  }

  if (email.indexOf('@', atIndex + 1) !== -1) {
    return { valid: false, reason: 'Email contains multiple @ symbols' };
  }

  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex + 1);

  if (localPart.length === 0 || localPart.length > 64) {
    return { valid: false, reason: 'Local part must be between 1 and 64 characters' };
  }

  if (domainPart.length === 0 || domainPart.length > 255) {
    return { valid: false, reason: 'Domain part must be between 1 and 255 characters' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Local part cannot start or end with a dot' };
  }

  if (localPart.includes('..')) {
    return { valid: false, reason: 'Local part cannot contain consecutive dots' };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { valid: false, reason: 'Domain part cannot start or end with a dot' };
  }

  if (domainPart.includes('..')) {
    return { valid: false, reason: 'Domain part cannot contain consecutive dots' };
  }

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return { valid: false, reason: 'Domain must have a valid TLD' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, reason: 'TLD must be at least 2 characters long' };
  }

  const validCharRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!validCharRegex.test(email)) {
    return { valid: false, reason: 'Email contains invalid characters' };
  }

  return { valid: true, reason: 'Valid syntax' };
}
