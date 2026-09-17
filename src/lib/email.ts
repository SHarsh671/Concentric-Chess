import "server-only";
import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const FROM_ADDRESS = "Concentric Chess <no-reply@capstone.mrvillage.dev>";

// process.env.NODE_ENV lets us skip actually sending mail (and avoid needing a
// live API key) while running unit tests / local dev without secrets set.
function getResend(): Resend | null {
  const apiKey = getCloudflareContext().env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function baseUrl(): string {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://capstone.mrvillage.dev";
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping verification email send.");
    return;
  }
  const url = `${baseUrl()}/verify-email/${token}`;
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your Concentric Chess email",
    html: `<p>Hi ${username},</p><p>Please verify your email address to unlock online play and invites.</p><p><a href="${url}">Verify Email</a></p><p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
  });
  if (error) {
    console.error("Error sending verification email:", error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping password reset email send.");
    return;
  }
  const url = `${baseUrl()}/reset-password/${token}`;
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Reset your Concentric Chess password",
    html: `<p>Hi ${username},</p><p>We received a request to reset your password. Click the link below to choose a new one.</p><p><a href="${url}">Reset Password</a></p><p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  });
  if (error) {
    console.error("Error sending password reset email:", error);
  }
}
