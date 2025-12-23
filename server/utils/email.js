const nodemailer = require('nodemailer');

const createTransporter = () => {
  console.log('Creating email transporter...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***set***' : '***NOT SET***');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***set***' : '***NOT SET***');

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is incomplete. Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  console.log('Sending email with options:', { ...mailOptions, html: '...' });
  
  const result = await transporter.sendMail(mailOptions);
  console.log('Email sent, messageId:', result.messageId);
  return result;
};

module.exports = { sendEmail };
