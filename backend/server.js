// backend/server.js

// ✅ Importing Express (Web Framework)
const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Import our custom services
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./emailService');
const { generateResetToken, storeResetToken, verifyResetToken, consumeResetToken } = require('./authService');

// Load environment variables
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serving Static Files (Your Frontend HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../")));

// ✅ Main Route (Loads the Main HTML File)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// Example: Handle login (authentication)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Here you would check the username/password in your database
  if (username === "admin" && password === "password") {
    res.json({ success: true, message: "Login successful!" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Example: Serve posts (serves data)
app.get("/posts", (req, res) => {
  // This would come from your database in a real app
  res.json([
    { id: 1, author: "Alice", content: "Hello world!" },
    { id: 2, author: "Bob", content: "Hi there!" },
  ]);
});

// Example: Save a comment (works with database)
app.post("/comment", (req, res) => {
  const { postId, comment } = req.body;
  // Here you would save the comment to your database
  res.json({ success: true, message: "Comment saved!" });
});

// Example: Business logic (only admins can delete posts)
app.delete("/post/:id", (req, res) => {
  const userRole = req.header("x-user-role"); // e.g., 'admin' or 'user'
  if (userRole !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  // Delete post from database here
  res.json({ success: true, message: "Post deleted!" });
});

// Password Reset Endpoints

// Request password reset - send email with reset link
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Store token (in production, you'd also check if user exists in database)
    storeResetToken(email, resetToken);

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: "Password reset email sent successfully"
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset email"
    });
  }
});

// Verify reset token and show reset form
app.get("/api/auth/verify-reset-token", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }

  const verification = verifyResetToken(token);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      message: verification.reason
    });
  }

  res.json({
    success: true,
    email: verification.email,
    message: "Token is valid"
  });
});

// Reset password with token
app.post("/api/auth/reset-password", (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    // Verify token
    const verification = verifyResetToken(token);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.reason
      });
    }

    // Here you would update the password in your database
    // For now, we'll just consume the token
    consumeResetToken(token);

    // In a real implementation, you'd:
    // 1. Hash the new password
    // 2. Update the user's password in the database
    // 3. Send confirmation email

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
});

// Welcome email endpoint (for new user registration)
app.post("/api/auth/send-welcome", async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    await sendWelcomeEmail(email, username);

    res.json({
      success: true,
      message: "Welcome email sent successfully"
    });

  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send welcome email"
    });
  }
});

// ✅ Starting the Server
app.listen(PORT, () => {
  console.log(`✅ Noctive Server running at http://localhost:${PORT}`);
});


