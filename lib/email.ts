/**
 * Email service (Resend).
 *
 * Mock mode: records every "send" call into a process-local list so tests can
 * assert what would have gone out.
 *
 * Real mode: uses Resend.
 */
import { env } from "@/lib/env";

interface EmailMessage {
  to: string;
  subject: string;
  /** Either plain text or HTML; we prefer HTML. */
  html: string;
}

// Cross-bundle singleton (RSC vs Node) — see lib/db/memory.ts
const _globals = globalThis as unknown as { __livingPhotosSentEmails?: EmailMessage[] };
if (!_globals.__livingPhotosSentEmails) _globals.__livingPhotosSentEmails = [];
const sent: EmailMessage[] = _globals.__livingPhotosSentEmails;

export async function sendEmail(msg: EmailMessage): Promise<{ id: string }> {
  if (env.MOCK_MODE || !env.RESEND_API_KEY) {
    sent.push(msg);
    return { id: `mock_email_${sent.length}` };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
  const json = (await res.json()) as { id: string };
  return { id: json.id };
}

/** Minimal HTML escape so user-controlled scene titles can't inject markup. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sceneReadyEmail(args: {
  to: string;
  title: string;
  shareUrl: string;
}): EmailMessage {
  const safeTitle = escapeHtml(args.title);
  // Subject lines render as plain text in all major clients but stripping
  // angle brackets + quotes is cheap insurance for preview panes.
  const subjectTitle = args.title.replace(/[<>"\r\n]/g, " ").slice(0, 100);
  return {
    to: args.to,
    subject: `Your memory is ready: "${subjectTitle}"`,
    html: `
<div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 480px; margin: 0 auto;">
  <p style="font-size: 14px; letter-spacing: 4px; color: #888; text-transform: uppercase;">LIVING PHOTOS</p>
  <h1 style="font-weight: 300; font-size: 28px; line-height: 1.2;">Your memory is ready to step inside.</h1>
  <p style="color: #555;">"${safeTitle}" — open the link below and walk in. Voices and ambient sound included.</p>
  <p style="margin: 32px 0;">
    <a href="${args.shareUrl}"
       style="display: inline-block; background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-size: 14px;">
      Step inside →
    </a>
  </p>
  <p style="font-size: 12px; color: #999;">
    Share the link with anyone — no account needed. The memory is yours forever.
  </p>
</div>`.trim(),
  };
}

/** Test helpers. */
export function getSentEmails() {
  return [...sent];
}
export function clearSentEmails() {
  sent.length = 0;
}
