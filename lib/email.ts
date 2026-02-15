import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailParams {
    email: string;
    name: string;
    verificationToken: string;
}

/**
 * Send email verification link to user
 * @param email - User's email address
 * @param name - User's name
 * @param verificationToken - Unique verification token
 */
export async function sendVerificationEmail({
    email,
    name,
    verificationToken,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
            to: email,
            subject: 'Verify your email address',
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Beverage Tracker!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up! Please verify your email address to complete your registration and start tracking your tea and coffee consumption.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}
