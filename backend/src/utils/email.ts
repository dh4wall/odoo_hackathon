import nodemailer from "nodemailer";

interface SendPasswordOptions {
  to: string;
  name: string;
  companyName: string;
  newPasswordPlain: string;
  role: string;
}

export const sendPasswordEmail = async ({
  to,
  name,
  companyName,
  newPasswordPlain,
  role
}: SendPasswordOptions): Promise<void> => {
  // If no SMTP details are in ENV, just log it out (fallback for dev without real keys)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP credentials missing. Logging email instead:");
    console.log(`📧 To: ${to} | Subject: Welcome to ${companyName} (${role})`);
    console.log(`🔑 Password: ${newPasswordPlain}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Aura Hack" <noreply@aurahack.io>',
    to,
    subject: `Your account credentials for ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to ${companyName}, ${name}!</h2>
        <p>Your admin has generated a new account for you with the role of <strong>${role}</strong>.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Temporary Password:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${newPasswordPlain}</p>
        </div>
        <p>Please log in immediately and change your password in your settings.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't expect this email, please contact your administrator.</p>
      </div>
    `,
  };

  try {
    console.log(`[SMTP] Attempting to send email to ${to} for user ${name} (${role})`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email successfully dispatched! Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`[SMTP] Critical failure during transporter.sendMail:`, err);
    throw err; // Propagate up to controller
  }
};

