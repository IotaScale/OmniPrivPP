import 'server-only';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

// Transactional email for the Partner Portal (team invites, password resets).
// Uses the same SMTP_* variables as the customer support app
// (omnipriv-customer-support/customer-support/backend/lib/notifications.ts).
// Email is opt-in: until SMTP_HOST, SMTP_PORT and SMTP_FROM are set,
// sendEmail() is a no-op that reports { sent: false } so callers can fall back
// (e.g. show the invite link to the owner).

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

/** Public origin used to build links in emails. */
export function getAppBaseUrl(): string {
  const raw = process.env.APP_BASE_URL || 'https://partner.omnipriv.com';
  try {
    return new URL(raw).origin;
  } catch {
    return 'https://partner.omnipriv.com';
  }
}

let cachedTransport: Mail | null = null;

function getTransport(): Mail | null {
  if (!isEmailConfigured()) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return cachedTransport;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

/** Send one email. Never throws. */
export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<SendEmailResult> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.info('[EMAIL] Skipped: SMTP is not configured.');
      return { sent: false, error: 'Email is not configured.' };
    }
    const recipient = to.trim().toLowerCase();
    if (!recipient) return { sent: false, error: 'No recipient.' };
    await transport.sendMail({ from: process.env.SMTP_FROM, to: recipient, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error('[EMAIL_SEND_ERROR]', err);
    return { sent: false, error: err instanceof Error ? err.message : 'Email delivery failed.' };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BrandedEmailInput {
  heading: string;
  /** Plain-text paragraphs (escaped for HTML). */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

/** Simple OmniPriv-branded HTML body plus a matching plain-text fallback. */
export function renderBrandedEmail({ heading, paragraphs, cta, footnote }: BrandedEmailInput): {
  html: string;
  text: string;
} {
  const navy = '#0A1628';
  const cyan = '#00B8DB';
  const muted = '#5B6B82';

  const paragraphHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${navy};">${escapeHtml(p)}</p>`
    )
    .join('');

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:10px;background:${cyan};">
<a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#03121c;text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)}</a>
</td></tr></table>
<p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:${muted};">If the button doesn't work, paste this link into your browser:<br><a href="${escapeHtml(cta.url)}" style="color:${cyan};word-break:break-all;">${escapeHtml(cta.url)}</a></p>`
    : '';

  const footnoteHtml = footnote
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${muted};">${escapeHtml(footnote)}</p>`
    : '';

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FA;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #E2E8F0;">
<tr><td style="padding:24px 32px;border-bottom:1px solid #E2E8F0;">
<span style="font-size:18px;font-weight:700;color:${navy};letter-spacing:-0.02em;">Omni<span style="color:${cyan};">Priv</span></span>
<span style="font-size:12px;color:${muted};margin-left:8px;">Partner Portal</span>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:${navy};">${escapeHtml(heading)}</h1>
${paragraphHtml}${ctaHtml}${footnoteHtml}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;font-size:12px;color:${muted};">&copy; ${new Date().getFullYear()} OmniPriv Inc. &middot; This is an automated message from the OmniPriv Partner Portal.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    heading,
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...(cta ? [`${cta.label}: ${cta.url}`, ''] : []),
    ...(footnote ? [footnote, ''] : []),
    '— OmniPriv Partner Portal',
  ].join('\n');

  return { html, text };
}
