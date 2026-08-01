const ROLE_PREFIXES = [
  'admin', 'support', 'sales', 'billing', 'info', 'webmaster', 'hr', 'careers',
  'postmaster', 'abuse', 'noreply', 'no-reply', 'no.reply', 'hostmaster',
  'marketing', 'press', 'security', 'office', 'contact', 'help', 'team',
  'legal', 'feedback', 'enquiry', 'inquiry', 'subscribe', 'unsubscribe',
  'newsletter', 'mailer-daemon', 'www', 'ftp', 'usenet', 'news', 'root',
  'sysadmin', 'operator'
];

/**
 * Checks if the local part of an email matches common role-based accounts.
 * @param localPart The local part of the email address (before the @).
 * @returns An object indicating if it's a role account and the matching prefix.
 */
export function checkRoleAccount(localPart: string): { isRole: boolean; prefix: string | null } {
  const normalizedLocal = localPart.toLowerCase();
  
  for (const prefix of ROLE_PREFIXES) {
    if (normalizedLocal === prefix || normalizedLocal.startsWith(prefix + '-') || normalizedLocal.startsWith(prefix + '.')) {
      return { isRole: true, prefix };
    }
  }

  return { isRole: false, prefix: null };
}
