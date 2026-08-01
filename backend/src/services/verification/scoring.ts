import { EmailStatus } from '../../types/index.js';

export interface ScoreParams {
  syntaxValid: boolean;
  domainValid: boolean;
  hasMx: boolean;
  smtpConnected: boolean;
  smtpAccepted: boolean;
  smtpCode: number;
  isCatchAll: boolean;
  isDisposable: boolean;
  isRole: boolean;
  greylistRetried: boolean;
  timedOut: boolean;
  mailboxExists: boolean | null;
}

/**
 * Calculates a confidence score and classification status for an email address.
 * @param params The input parameters collected during verification.
 * @returns An object containing the score, status, and an array of reasons.
 */
export function calculateScore(params: ScoreParams): { score: number; status: EmailStatus; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base positive scoring
  if (params.syntaxValid) {
    score += 10;
    reasons.push('Valid syntax');
  } else {
    reasons.push('Invalid syntax');
  }

  if (params.domainValid) {
    score += 10;
    reasons.push('Domain resolves successfully');
  } else {
    reasons.push('Domain does not resolve');
  }

  if (params.hasMx) {
    score += 15;
    reasons.push('MX records found');
  } else {
    reasons.push('No MX records found');
  }

  if (params.smtpConnected) {
    score += 10;
    reasons.push('SMTP connection established');
  }

  if (params.smtpAccepted) {
    score += 30;
    reasons.push('SMTP server accepted the address');
  } else if (params.smtpCode >= 500 && params.smtpCode < 600) {
    reasons.push(`SMTP server rejected the address (Code: ${params.smtpCode})`);
  }

  if (!params.isCatchAll && params.domainValid) {
    score += 10;
    reasons.push('Domain is not a catch-all');
  } else if (params.isCatchAll) {
    score -= 20;
    reasons.push('Domain is configured as a catch-all');
  }

  if (!params.isDisposable) {
    score += 5;
  } else {
    score -= 40;
    reasons.push('Domain is a known disposable email provider');
  }

  if (!params.isRole) {
    score += 5;
  } else {
    score -= 5;
    reasons.push('Address is a role-based account');
  }

  if (params.mailboxExists === true) {
    score += 5;
    reasons.push('Mailbox existence definitively confirmed');
  }

  if (params.greylistRetried) {
    score -= 10;
    reasons.push('Encountered greylisting and required retries');
  }

  if (params.timedOut) {
    score -= 15;
    reasons.push('One or more verification steps timed out');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: EmailStatus = 'unknown';

  if (!params.syntaxValid || !params.domainValid || (params.smtpCode >= 500 && params.smtpCode < 600)) {
    status = 'invalid';
  } else if (params.smtpAccepted && params.isCatchAll) {
    status = 'catch-all';
  } else if (score >= 80 && params.smtpAccepted && !params.isCatchAll) {
    status = 'valid';
  } else if (score >= 40 && score < 80) {
    status = 'risky';
  } else if (params.timedOut && !params.smtpConnected) {
    status = 'unknown';
  } else if (score < 40 && !params.smtpAccepted) {
    status = 'invalid';
  } else {
    status = 'unknown';
  }

  return { score, status, reasons };
}
