/**
 * lib/email.ts — Transactional email via Resend
 *
 * Setup: add RESEND_API_KEY to .env  (free tier: 3,000 emails/month)
 * Optionally set RESEND_FROM_EMAIL and NEXT_PUBLIC_APP_URL.
 *
 * If RESEND_API_KEY is absent, all sends are silently skipped (logged to
 * console only), so the app works in dev without any config.
 */

import { prisma } from "@/lib/prisma";

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL   ?? "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL    ?? "NAMO <onboarding@resend.dev>";

// ── HTML template ─────────────────────────────────────────────────────────────

export function buildEmailHtml(
  title: string,
  body: string,
  ctaUrl?: string,
  ctaLabel = "Open in NAMO →"
): string {
  const resolvedCta = ctaUrl ? `${APP_URL}${ctaUrl.startsWith("/") ? ctaUrl : `/${ctaUrl}`}` : null;

  const ctaButton = resolvedCta
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
        <tr>
          <td>
            <a href="${resolvedCta}"
               style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#4338ca 100%);border-radius:16px 16px 0 0;padding:22px 32px;">
              <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">⚡ NAMO</span>
              <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-left:10px;letter-spacing:0.04em;text-transform:uppercase;">Neural Analytics</span>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h2>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.65;">${body.replace(/\n/g, "<br>")}</p>
              ${ctaButton}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                You're receiving this because you're a member of NAMO — Neural Analytics for Management Optimization.
                <br>Manage your notifications in <a href="${APP_URL}/profile" style="color:#7c3aed;text-decoration:none;">your profile</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Core send ─────────────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev mode: log instead of sending
    console.log(`[email:skip] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[email:error]", err);
    }
  } catch (err) {
    console.error("[email:error]", err);
  }
}

// ── High-level helpers (fetch user email → send) ──────────────────────────────

/**
 * Look up a user's email by ID and send them a notification email.
 * Non-throwing — any failure is silently caught.
 */
export async function sendEmailToUser(
  userId: string,
  subject: string,
  title: string,
  body: string,
  ctaUrl?: string,
  ctaLabel?: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;
    const html = buildEmailHtml(title, body, ctaUrl, ctaLabel);
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[email:sendEmailToUser]", err);
  }
}

/**
 * Send the same email to multiple users (by ID array).
 * Non-throwing — failures are silently caught per-user.
 */
export async function sendEmailToUsers(
  userIds: string[],
  subject: string,
  title: string,
  body: string,
  ctaUrl?: string,
  ctaLabel?: string
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true },
    });
    const html = buildEmailHtml(title, body, ctaUrl, ctaLabel);
    await Promise.all(
      users
        .filter((u) => u.email)
        .map((u) => sendEmail({ to: u.email, subject, html }).catch(console.error))
    );
  } catch (err) {
    console.error("[email:sendEmailToUsers]", err);
  }
}
