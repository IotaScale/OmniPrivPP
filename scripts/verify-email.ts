/**
 * Check the Partner Portal SMTP setup (same code path the app uses).
 *
 *   npm run email:verify                  # DNS + TLS + login only (no email sent)
 *   npm run email:verify -- you@example.com   # also sends a test email
 *
 * Reads SMTP_* from .env. Never prints the password.
 */
import { DEFAULT_EMAIL_FROM, isEmailConfigured, sendEmail, verifyEmailTransport } from '../src/lib/email/mailer';

async function main() {
  const to = process.argv[2];
  console.log('SMTP host:', process.env.SMTP_HOST || '(not set)');
  console.log('SMTP port:', process.env.SMTP_PORT || '465 (default)');
  console.log('SMTP user:', process.env.SMTP_USER || '(not set)');
  console.log('From     :', process.env.SMTP_FROM || DEFAULT_EMAIL_FROM);

  if (!isEmailConfigured()) {
    console.error('\nNot configured: set SMTP_HOST, SMTP_USER and SMTP_PASSWORD.');
    process.exit(1);
  }

  const verified = await verifyEmailTransport();
  if (!verified.ok) {
    console.error('\nSMTP verification failed:', verified.error);
    process.exit(1);
  }
  console.log('\nSMTP connection and login OK.');

  if (to) {
    const result = await sendEmail({
      to,
      subject: 'OmniPriv Partner Portal — test email',
      text: 'This is a test email from the OmniPriv Partner Portal. If you received it, team invites and password resets will be delivered.',
    });
    if (!result.sent) {
      console.error('Test email failed:', result.error);
      process.exit(1);
    }
    console.log(`Test email sent to ${to}.`);
  }
}

main();
