const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  // Validate env vars before attempting
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "youremail@gmail.com") {
    throw new Error("EMAIL_USER is not configured in .env");
  }
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === "your_16_char_app_password") {
    throw new Error("EMAIL_PASS is not configured in .env");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection before sending
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"ProjectFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent to:", to, "| Message ID:", info.messageId);
  return info;
};

module.exports = sendEmail;