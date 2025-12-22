// test-email.js - Simple test script for email functionality
const fetch = require('node-fetch');

async function testEmail() {
  try {
    console.log('Testing password reset email...');

    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      console.log('✅ Email sent successfully!');
      console.log('Check the server console for the Ethereal test email URL');
    } else {
      console.log('❌ Failed to send email:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing email:', error.message);
  }
}

testEmail();