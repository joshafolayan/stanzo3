const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetToken) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // The reset URL points to the frontend reset page
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Admin System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] Password reset email sent to ${email} (Message ID: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR] Failed to send password reset email:', error);
        return false;
    }
};

module.exports = { sendResetEmail };
