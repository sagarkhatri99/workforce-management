import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
      console.log(`[Email Mock] To: ${to}, Subject: ${subject}, Body: ${text}`);
      return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
    });
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
