// backend/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (emailService === 'ethereal') {
    // For testing - create Ethereal test account
    return nodemailer.createTestAccount().then(testAccount => {
      console.log('Ethereal test account created:', testAccount);
      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  } else if (emailService === 'sendgrid') {
    // SendGrid configuration
    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (emailService === 'outlook') {
    // Outlook configuration
    return nodemailer.createTransporter({
      service: 'outlook',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Default Gmail configuration
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = await createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/new-password.html?token=${resetToken}`;

    const mailOptions = {
      from: `"Noctive Gaming" <${process.env.EMAIL_USER || 'noreply@noctive.com'}>`,
      to: email,
      subject: 'Reset Your Noctive Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: 'Nunito', Arial, sans-serif; background: linear-gradient(135deg, #121524, #1e2242); color: #f0f0f0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom right, #1d2133, #292e44); border-radius: 1rem; padding: 2rem; border: 1px solid rgba(250, 204, 21, 0.2); }
            .logo { font-size: 2rem; color: #facc15; text-align: center; margin-bottom: 1rem; }
            h1 { color: #facc15; text-align: center; margin-bottom: 2rem; }
            .reset-button { display: inline-block; background: linear-gradient(90deg, #facc15, #fbbf24); color: #121524; padding: 12px 24px; text-decoration: none; border-radius: 0.5rem; font-weight: bold; margin: 1rem 0; }
            .reset-button:hover { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
            .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(250, 204, 21, 0.2); font-size: 0.9rem; color: #d0d0d0; text-align: center; }
            .warning { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; color: #fca5a5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">NOCTIVE</div>
            <h1>Forgot Your Password?</h1>
            <p>Hello!</p>
            <p>You recently requested to reset your password for your Noctive account. Click the button below to create a new password:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>

            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 0.5rem; font-family: monospace;">${resetUrl}</p>

            <div class="footer">
              <p>This email was sent to you because a password reset was requested for your Noctive account.</p>
              <p>If you have any questions, contact our support team.</p>
              <p>&copy; 2025 Noctive Gaming Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        NOCTIVE - Reset Your Password

        Hello!

        You recently requested to reset your password for your Noctive account.

        Click this link to create a new password:
        ${resetUrl}

        This link will expire in 1 hour for your security.

        If you didn't request this password reset, please ignore this email.

        If you have any questions, contact our support team.

        © 2025 Noctive Gaming Platform. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);

    // If using Ethereal, log the test URL
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      console.log('Test email URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Noctive Gaming" <${process.env.EMAIL_USER || 'noreply@noctive.com'}>`,
      to: email,
      subject: 'Welcome to Noctive Gaming!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Noctive</title>
          <style>
            body { font-family: 'Nunito', Arial, sans-serif; background: linear-gradient(135deg, #121524, #1e2242); color: #f0f0f0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom right, #1d2133, #292e44); border-radius: 1rem; padding: 2rem; border: 1px solid rgba(250, 204, 21, 0.2); }
            .logo { font-size: 2rem; color: #facc15; text-align: center; margin-bottom: 1rem; }
            h1 { color: #facc15; text-align: center; margin-bottom: 2rem; }
            .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(250, 204, 21, 0.2); font-size: 0.9rem; color: #d0d0d0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">NOCTIVE</div>
            <h1>Welcome to Noctive, ${username || 'Gamer'}!</h1>
            <p>Thank you for joining the Noctive gaming community!</p>
            <p>You're now part of a platform that puts you first - no algorithms, just pure gaming freedom.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Connect with fellow gamers</li>
              <li>Share your gaming experiences</li>
              <li>Discover new games and communities</li>
              <li>Create and join gaming hubs</li>
            </ul>
            <p>Start exploring and enjoy your gaming journey!</p>
            <div class="footer">
              <p>&copy; 2025 Noctive Gaming Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};