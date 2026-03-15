const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const SENDER_EMAIL = process.env.EMAIL_FROM || 'admin@allroundstores.com';
const sender = { email: SENDER_EMAIL, name: "Store System" };

const sendResetEmail = async (email, resetToken, role = 'user') => {
    try {
        const resetUrl = `${process.env.CLIENT_URL || 'https://allroundstores.com'}${role === 'admin' ? '/admin' : ''}/reset-password?token=${resetToken}`;

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.subject = 'Password Reset Request';
        sendSmtpEmail.htmlContent = `
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
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[EMAIL SENT] Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR] Failed to send password reset email:', error);
        return false;
    }
};

const sendOrderConfirmationEmail = async (email, order) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.subject = `Order Confirmation - #${order._id}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Thank you for your order!</h2>
                <p>Your order <strong>#${order._id}</strong> has been received and is currently pending processing.</p>
                <h3>Order Summary</h3>
                <ul>
                    ${order.items.map(item => `<li>${item.quantity}x ${item.name} - $${item.price}</li>`).join('')}
                </ul>
                <p><strong>Total Amount: $${order.totalAmount}</strong></p>
                <p>We will notify you once your order is confirmed and shipped.</p>
            </div>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[EMAIL SENT] Order confirmation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR] Failed to send order confirmation email:', error);
        return false;
    }
};

const sendNewOrderAdminEmail = async (adminEmails, order) => {
    try {
        const toRecipients = Array.isArray(adminEmails) 
            ? adminEmails.map(email => ({ email })) 
            : [{ email: adminEmails }];

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = toRecipients;
        sendSmtpEmail.subject = `New Order Received - #${order._id}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Order Received!</h2>
                <p>A new order <strong>#${order._id}</strong> has been placed.</p>
                <h3>Customer Information</h3>
                <p>Name: ${order.customerInfo?.name || 'N/A'}</p>
                <p>Email: ${order.customerInfo?.email || 'N/A'}</p>
                <p>Phone: ${order.customerInfo?.phone || 'N/A'}</p>
                <h3>Order Summary</h3>
                <ul>
                    ${order.items.map(item => `<li>${item.quantity}x ${item.name} - $${item.price}</li>`).join('')}
                </ul>
                <p><strong>Total Amount: $${order.totalAmount}</strong></p>
                <p>Please log in to the admin panel to process this order.</p>
            </div>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[EMAIL SENT] New order notification sent to admins`);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR] Failed to send new order admin email:', error);
        return false;
    }
};

module.exports = { sendResetEmail, sendOrderConfirmationEmail, sendNewOrderAdminEmail };