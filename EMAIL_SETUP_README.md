# Custom Email Setup for Noctive

This guide will help you set up custom email functionality for password reset and other email features in your Noctive application.

## Features

- ✅ Custom password reset emails with branded templates
- ✅ Secure token-based password reset system
- ✅ Welcome emails for new users
- ✅ Multiple email service support (Gmail, Outlook, SendGrid, etc.)
- ✅ HTML email templates with responsive design

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in your project root with your email settings:

```env
# Server Configuration
PORT=5000

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Email Configuration - Choose ONE of the following:

# Option 1: Gmail (Recommended)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Option 2: Outlook/Hotmail
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password

# Option 3: SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Option 4: Other SMTP services
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@provider.com
EMAIL_PASS=your-password
```

### 2. Gmail Setup (Most Common)

For Gmail, you need to create an "App Password":

1. Go to your Google Account settings
2. Enable 2-factor authentication if not already enabled
3. Go to "Security" → "App passwords"
4. Generate a new app password for "Mail"
5. Use this app password (not your regular password) in the `.env` file

### 3. SendGrid Setup (Professional)

1. Sign up for a free SendGrid account at https://sendgrid.com
2. Create an API key in your SendGrid dashboard
3. Add the API key to your `.env` file
4. Verify your sender email address

### 4. Testing the Setup

1. Start your backend server:
```bash
npm start
```

2. Test password reset:
   - Go to `http://localhost:3000/reset-password.html`
   - Enter an email address
   - Check your email for the reset link
   - Click the link to set a new password

## API Endpoints

### Password Reset

**Request Password Reset:**
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Reset Password:**
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "new-password-here"
}
```

**Verify Reset Token:**
```
GET /api/auth/verify-reset-token?token=reset-token-here
```

### Welcome Email

**Send Welcome Email:**
```
POST /api/auth/send-welcome
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username" // optional
}
```

## Email Templates

The email templates are located in `backend/emailService.js`. You can customize:

- **Sender name and email**
- **Email subject and content**
- **Branding and colors**
- **Redirect URLs**

## Security Features

- ✅ Secure token generation using crypto.randomBytes()
- ✅ Token expiration (1 hour)
- ✅ Password strength requirements
- ✅ Rate limiting protection
- ✅ HTTPS recommended for production

## Production Deployment

For production deployment:

1. Use environment variables instead of `.env` file
2. Set up proper SMTP service (SendGrid, AWS SES, etc.)
3. Enable HTTPS
4. Add email analytics and monitoring
5. Implement proper database for token storage
6. Add rate limiting and abuse protection

## Troubleshooting

### Common Issues:

**"Authentication failed" with Gmail:**
- Make sure you're using an App Password, not your regular password
- Enable 2-factor authentication on your Google account

**Emails going to spam:**
- Set up SPF, DKIM, and DMARC records for your domain
- Use a reputable email service like SendGrid
- Avoid spam trigger words in email content

**Reset links not working:**
- Check that FRONTEND_URL in .env matches your frontend URL
- Ensure the new-password.html page is accessible
- Verify token expiration (1 hour limit)

### Testing Email Delivery:

You can use tools like:
- **MailHog** for local email testing
- **Ethereal Email** for testing without real emails
- **SendGrid's email testing** features

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify your .env configuration
3. Test with different email providers
4. Check email service status pages

## File Structure

```
backend/
├── emailService.js      # Email sending logic and templates
├── authService.js       # Token generation and verification
└── server.js           # API endpoints

frontend/
├── reset-password.html  # Request password reset page
├── new-password.html    # Set new password page
└── index.html          # Main application
```