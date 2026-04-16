import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const isPlaceholderValue = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("yourmailhost.com") ||
    normalized.includes("your_smtp_password") ||
    normalized.includes("example.com")
  );
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (
    isPlaceholderValue(host) ||
    isPlaceholderValue(user) ||
    isPlaceholderValue(pass)
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

export async function sendMail({ to, subject, html, text, attachments = [] }) {
  const fromName = process.env.MAIL_FROM_NAME || "Blowit by AVLC";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("Email skipped: SMTP is not configured with real values yet.");
    return;
  }

  // do not block main flow on email error
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
  } catch (err) {
    // Log and continue
    console.error("Email send error:", err.message);
  }
}
