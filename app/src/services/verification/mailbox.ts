/**
 * Determines whether a mailbox exists based on SMTP results and catch-all status.
 * @param smtpAccepted Whether the SMTP server accepted the RCPT TO command.
 * @param isCatchAll Whether the domain is a catch-all domain.
 * @returns An object containing the existence status and a descriptive reason.
 */
export function checkMailboxExists(smtpAccepted: boolean, isCatchAll: boolean): { exists: boolean | null; reason: string } {
  if (smtpAccepted && !isCatchAll) {
    return { exists: true, reason: 'Mailbox exists and actively accepts mail' };
  }
  
  if (!smtpAccepted) {
    return { exists: false, reason: 'Mailbox rejected the recipient address' };
  }
  
  if (isCatchAll) {
    return { exists: null, reason: 'Domain is configured as a catch-all, mailbox existence is indeterminate' };
  }
  
  return { exists: null, reason: 'Unable to conclusively determine mailbox existence' };
}
