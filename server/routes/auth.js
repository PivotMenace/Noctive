// ...existing code...

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    console.log('Reset token generated for:', email);
    console.log('Frontend URL:', process.env.FRONTEND_URL);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    console.log('Attempting to send email to:', email);
    console.log('Reset URL:', resetUrl);
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click here to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    console.log('Email sent successfully to:', email);
    res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

// ...existing code...