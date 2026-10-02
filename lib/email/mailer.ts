import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Mail settings come from .env and stay on the server.
function readSmtpSettings() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  return {
    host,
    port,
    // Port 465 uses TLS from the start; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    from: process.env.EMAIL_FROM?.trim() || `Soma <${user}>`,
  };
}

let transporter: Transporter | null = null;

export function isEmailConfigured() {
  return readSmtpSettings() !== null;
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const settings = readSmtpSettings();
  if (!settings) {
    throw new Error("Email isn't configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to .env.");
  }

  transporter ??= nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.auth,
  });

  await transporter.sendMail({ from: settings.from, ...message });
}
