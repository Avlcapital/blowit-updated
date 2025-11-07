import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Blowit Cars" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Blowit Password Reset OTP",
    html: `
      <h3>OTP Verification</h3>
      <p>Your password reset OTP is: <b>${otp}</b></p>
      <p>This OTP will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
