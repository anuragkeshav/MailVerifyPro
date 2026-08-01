import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { validateSyntax } from './syntax.js';
import { checkDisposable } from './disposable.js';
import { checkRoleAccount } from './roleAccount.js';
import { validateDomain } from './domain.js';
import { smtpVerify } from './smtp.js';
import { checkCatchAll } from './catchAll.js';
import { checkMailboxExists } from './mailbox.js';
import { handleGreylisting } from './greylisting.js';
import { wrapWithTimeout } from './timeout.js';
import { EmailResult, EmailStatus } from '../../types/index.js';
import { calculateScore } from './scoring.js';

/**
 * Orchestrates the complete 10-step email verification pipeline.
 * @param email The email address to verify.
 * @returns A promise resolving to the comprehensive EmailResult.
 */
export async function verifyEmail(email: string): Promise<EmailResult> {
  const startTime = Date.now();
  const result: Partial<EmailResult> = {
    email,
    status: 'unknown',
    confidence: 0,
    mxHost: '',
    smtpCode: 0,
    smtpMessage: '',
    isDisposable: false,
    isRole: false,
    isCatchAll: false,
    reason: '',
    retryCount: 0
  };

  const scoringParams = {
    syntaxValid: false,
    domainValid: false,
    hasMx: false,
    smtpConnected: false,
    smtpAccepted: false,
    smtpCode: 0,
    isCatchAll: false,
    isDisposable: false,
    isRole: false,
    greylistRetried: false,
    timedOut: false,
    mailboxExists: <boolean | null>null
  };

  try {
    logger?.info(`Starting verification for: ${email}`);

    // Step 1: Syntax
    const syntaxResult = validateSyntax(email);
    scoringParams.syntaxValid = syntaxResult.valid;
    if (!syntaxResult.valid) {
      logger?.info(`Syntax invalid for ${email}: ${syntaxResult.reason}`);
      const scoreRes = calculateScore(scoringParams);
      return buildResult(result, scoreRes, startTime, syntaxResult.reason);
    }

    // Step 2: Extract parts
    const [localPart, domainPart] = email.split('@');

    // Step 3: Disposable
    const disposableResult = checkDisposable(domainPart);
    result.isDisposable = disposableResult.isDisposable;
    scoringParams.isDisposable = disposableResult.isDisposable;

    // Step 4: Role Account
    const roleResult = checkRoleAccount(localPart);
    result.isRole = roleResult.isRole;
    scoringParams.isRole = roleResult.isRole;

    // Step 5 & 6: Domain Validation & MX records
    let domainInfo;
    try {
      domainInfo = await validateDomain(domainPart);
      scoringParams.domainValid = true;
      scoringParams.hasMx = domainInfo.hasMx;
    } catch (err: any) {
      logger?.info(`Domain invalid or DNS error for ${domainPart}: ${err.message}`);
      scoringParams.domainValid = false;
      const scoreRes = calculateScore(scoringParams);
      return buildResult(result, scoreRes, startTime, 'Domain validation failed');
    }

    if (!domainInfo.hasMx || domainInfo.mxRecords.length === 0) {
      logger?.info(`No MX records for ${domainPart}`);
      const scoreRes = calculateScore(scoringParams);
      return buildResult(result, scoreRes, startTime, 'No MX records found');
    }

    const mxHost = domainInfo.mxRecords[0].exchange;
    result.mxHost = mxHost;

    // Step 7: SMTP Verification with Timeout
    const smtpTimeoutMs = config.SMTP_TIMEOUT || 15000;
    const { result: smtpResult, timedOut: smtpTimedOut, error: smtpError } = await wrapWithTimeout(
      smtpVerify(email, mxHost),
      smtpTimeoutMs,
      'SMTP Verification'
    );

    scoringParams.timedOut = smtpTimedOut;
    let finalSmtpResponse = smtpResult;

    if (smtpError) {
      logger?.warn(`SMTP connection failed for ${email}: ${smtpError}`);
      result.smtpMessage = smtpError;
    } else if (finalSmtpResponse) {
      scoringParams.smtpConnected = true;
      
      // Step 8: Greylisting check
      if (finalSmtpResponse.code >= 400 && finalSmtpResponse.code < 500) {
        logger?.info(`Possible greylisting (Code ${finalSmtpResponse.code}) for ${email}. Retrying...`);
        scoringParams.greylistRetried = true;
        result.retryCount = config.MAX_RETRIES || 3;
        finalSmtpResponse = await handleGreylisting(email, mxHost, result.retryCount);
      }

      result.smtpCode = finalSmtpResponse.code;
      result.smtpMessage = finalSmtpResponse.message;
      scoringParams.smtpCode = finalSmtpResponse.code;
      scoringParams.smtpAccepted = finalSmtpResponse.accepted;

      // Step 9: Catch-All Check (only if SMTP connected)
      if (scoringParams.smtpConnected) {
        const catchAllResult = await checkCatchAll(domainPart, mxHost);
        result.isCatchAll = catchAllResult.isCatchAll;
        scoringParams.isCatchAll = catchAllResult.isCatchAll;
      }

      // Step 10: Mailbox check
      const mailboxResult = checkMailboxExists(finalSmtpResponse.accepted, scoringParams.isCatchAll);
      scoringParams.mailboxExists = mailboxResult.exists;
    }

    // Step 11: Calculate final score and classification
    const scoreRes = calculateScore(scoringParams);
    return buildResult(result, scoreRes, startTime, scoreRes.reasons.join('. '));

  } catch (error: any) {
    logger?.error(`Unexpected error verifying ${email}:`, error);
    const scoreRes = calculateScore(scoringParams);
    return buildResult(result, scoreRes, startTime, `Internal error: ${error.message}`);
  }
}

function buildResult(
  partialResult: Partial<EmailResult>, 
  scoreRes: { score: number; status: EmailStatus; reasons: string[] }, 
  startTime: number, 
  reason: string
): EmailResult {
  return {
    email: partialResult.email || '',
    status: scoreRes.status,
    confidence: scoreRes.score,
    mxHost: partialResult.mxHost || '',
    smtpCode: partialResult.smtpCode || 0,
    smtpMessage: partialResult.smtpMessage || '',
    isDisposable: partialResult.isDisposable || false,
    isRole: partialResult.isRole || false,
    isCatchAll: partialResult.isCatchAll || false,
    reason,
    verificationTimeMs: Date.now() - startTime,
    retryCount: partialResult.retryCount || 0
  };
}
