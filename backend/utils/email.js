import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,         // e.g. mail.yourdomain.com
  port: Number(process.env.SMTP_PORT), // 465 SSL or 587 STARTTLS
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,       // e.g. no-reply@avlc-group.com
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html, text }) {
  const fromName = process.env.MAIL_FROM_NAME || "Blowit by AVLC";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  // do not block main flow on email error
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    // Log and continue
    console.error("Email send error:", err.message);
  }
}
