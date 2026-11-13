import 'server-only';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { OMNIPRIV_LOGO_CID, OMNIPRIV_LOGO_PNG_BASE64 } from './logo';

// Transactional email for the Partner Portal (team invites, password resets).
// Uses the same SMTP_* variables as the customer support app
// (omnipriv-customer-support/customer-support/backend/lib/notifications.ts).
// Email is opt-in: until SMTP_HOST, SMTP_USER and SMTP_PASSWORD are set,
// sendEmail() is a no-op that reports { sent: false } so callers can fall back
// (e.g. show the invite link to the owner).
//
// omnipriv.com mail is hosted on MXroute (MX monday.mxrouting.net; SPF already
// includes mxroute.com), so the expected production settings are:
//   SMTP_HOST=monday.mxrouting.net  SMTP_PORT=465  (implicit TLS)
//   SMTP_USER=partner@omnipriv.com  SMTP_PASSWORD=<mailbox password>
// Mail is sent From partner@omnipriv.com; MXroute only relays for the
// authenticated mailbox (or its aliases), so SMTP_USER should be that mailbox.

/** Default sender for Partner Portal mail. */
export const DEFAULT_EMAIL_FROM = '"OmniPriv Partner Portal" <partner@omnipriv.com>';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function smtpPort(): number {
  const port = Number(process.env.SMTP_PORT);
  return Number.isInteger(port) && port > 0 ? port : 465;
}

/**
 * Implicit TLS on 465; STARTTLS (required) on 587/25. SMTP_SECURE overrides.
 * Passing `secure: false` explicitly would disable nodemailer's own
 * "465 means secure" default, which is why this is computed here.
 */
function smtpSecure(port: number): boolean {
  const flag = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return port === 465;
}

function emailFrom(): string {
  return process.env.SMTP_FROM?.trim() || DEFAULT_EMAIL_FROM;
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
    const port = smtpPort();
    const secure = smtpSecure(port);
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      // On 587/25, refuse to send credentials without a STARTTLS upgrade.
      requireTLS: !secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      // Serverless-friendly limits (nodemailer defaults are 2 min / 10 min).
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return cachedTransport;
}

/**
 * Check DNS, TCP, TLS and SMTP authentication without sending a message
 * (nodemailer `transporter.verify()`). Used by `npm run email:verify`.
 */
export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) return { ok: false, error: 'SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set.' };
  try {
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMTP verification failed.' };
  }
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
    await transport.sendMail({
      from: emailFrom(),
      replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
      to: recipient,
      subject,
      text,
      html,
      // Branded emails reference the logo by Content-ID; ship it inline so it
      // renders even where remote images are blocked (Outlook, corporate mail).
      attachments: html?.includes(`cid:${OMNIPRIV_LOGO_CID}`)
        ? [
            {
              filename: 'omnipriv-logo.png',
              content: Buffer.from(OMNIPRIV_LOGO_PNG_BASE64, 'base64'),
              contentType: 'image/png',
              cid: OMNIPRIV_LOGO_CID,
              contentDisposition: 'inline',
            },
          ]
        : undefined,
    });
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
  /** Hidden inbox preview line. */
  preheader?: string;
  heading: string;
  /** Plain-text paragraphs (escaped for HTML). */
  paragraphs: string[];
  /** Key/value summary box, e.g. Organization / Invited by / Role. */
  details?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

/** OmniPriv-branded HTML email (omnipriv.com palette and logo) plus a plain-text fallback. */
export function renderBrandedEmail({ preheader, heading, paragraphs, details, cta, footnote }: BrandedEmailInput): {
  html: string;
  text: string;
} {
  // omnipriv.com design tokens
  const navy = '#0A1628';
  const ink = '#0F172A';
  const cyan = '#00B8DB';
  const cyanText = '#00667A';
  const onCyan = '#03121C';
  const muted = '#475569';
  const line = '#E2E8F0';
  const page = '#F1F5F9';
  const font = "'Onest','Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
  const display = "'Sora','Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
  const base = getAppBaseUrl();
  // Inline CID attachment (added by sendEmail), not a remote URL: shows even
  // when the client blocks remote images. PNG, since Gmail/Outlook block SVG.
  const logoUrl = `cid:${OMNIPRIV_LOGO_CID}`;

  const paragraphHtml = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${ink};">${escapeHtml(p)}</p>`)
    .join('');

  const detailsHtml = details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;border:1px solid ${line};border-radius:12px;background:#F8FAFC;">
${details
  .map((d, i) => {
    const sep = i ? `border-top:1px solid ${line};` : '';
    return `<tr><td style="padding:12px 16px;${sep}font-size:13px;color:${muted};width:38%;">${escapeHtml(d.label)}</td><td style="padding:12px 16px;${sep}font-size:14px;font-weight:600;color:${navy};">${escapeHtml(d.value)}</td></tr>`;
  })
  .join('\n')}
</table>`
    : '';

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;"><tr><td style="border-radius:10px;background:${cyan};">
<a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:15px;font-weight:600;color:${onCyan};text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)} &rarr;</a>
</td></tr></table>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${muted};">Button not working? Paste this link into your browser:<br><a href="${escapeHtml(cta.url)}" style="color:${cyanText};word-break:break-all;">${escapeHtml(cta.url)}</a></p>`
    : '';

  const footnoteHtml = footnote
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${muted};">${escapeHtml(footnote)}</p>`
    : '';

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`
    : '';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${page};font-family:${font};-webkit-font-smoothing:antialiased;">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${page};padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;border:1px solid ${line};overflow:hidden;">
<tr><td style="height:4px;background:${cyan};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 32px;border-bottom:1px solid ${line};">
<a href="https://omnipriv.com" style="text-decoration:none;"><img src="${logoUrl}" width="140" height="29" alt="OmniPriv" style="display:inline-block;width:140px;height:29px;border:0;vertical-align:middle;color:#0A1628;font-size:20px;font-weight:700;"></a>
<span style="display:inline-block;margin-left:10px;padding:3px 9px;border-radius:999px;background:#E6F8FC;color:${cyanText};font-size:11px;font-weight:600;letter-spacing:0.02em;vertical-align:middle;">Partner Portal</span>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 20px;font-family:${display};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${navy};">${escapeHtml(heading)}</h1>
${paragraphHtml}${detailsHtml}${ctaHtml}${footnoteHtml}
</td></tr>
<tr><td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid ${line};font-size:12px;line-height:1.6;color:${muted};">
<a href="https://omnipriv.com" style="color:${cyanText};text-decoration:none;">omnipriv.com</a> &nbsp;&middot;&nbsp;
<a href="${base}" style="color:${cyanText};text-decoration:none;">Partner Portal</a> &nbsp;&middot;&nbsp;
<a href="https://support.omnipriv.com" style="color:${cyanText};text-decoration:none;">Support</a><br>
&copy; ${new Date().getFullYear()} OmniPriv Inc. AI-Powered Privileged Access Management.<br>
This is an automated message from partner@omnipriv.com.
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    heading,
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...(details?.length ? [...details.map((d) => `${d.label}: ${d.value}`), ''] : []),
    ...(cta ? [`${cta.label}: ${cta.url}`, ''] : []),
    ...(footnote ? [footnote, ''] : []),
    '— OmniPriv Partner Portal · https://omnipriv.com',
  ].join('\n');

  return { html, text };
}
