// backend/authService.js

const crypto = require('crypto');

// Simple in-memory token store (in production, use Redis or database)
const resetTokens = new Map();

// Generate a secure reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store reset token with expiration (1 hour)
const storeResetToken = (email, token) => {
  const expiration = Date.now() + (60 * 60 * 1000); // 1 hour
  resetTokens.set(token, {
    email,
    expiration
  });

  // Clean up expired tokens periodically
  setTimeout(() => {
    resetTokens.delete(token);
  }, 60 * 60 * 1000);
};

// Verify reset token
const verifyResetToken = (token) => {
  const tokenData = resetTokens.get(token);

  if (!tokenData) {
    return { valid: false, reason: 'Token not found' };
  }

  if (Date.now() > tokenData.expiration) {
    resetTokens.delete(token);
    return { valid: false, reason: 'Token expired' };
  }

  return { valid: true, email: tokenData.email };
};

// Remove used token
const consumeResetToken = (token) => {
  resetTokens.delete(token);
};

module.exports = {
  generateResetToken,
  storeResetToken,
  verifyResetToken,
  consumeResetToken
};