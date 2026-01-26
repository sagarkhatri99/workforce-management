import { Resend } from 'resend';

export class EmailService {
    private resend: Resend;
    private fromEmail: string;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  RESEND_API_KEY not set. Email service will not work.');
            this.resend = new Resend('dummy-key');
        } else {
            this.resend = new Resend(apiKey);
        }
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@workforce.com';
    }

    /**
     * Send user invitation email
     */
    async sendInvitation(
        to: string,
        inviteToken: string,
        organizationName: string,
        invitedBy: string
    ): Promise<void> {
        try {
            const inviteUrl = `${process.env.WEB_APP_URL || 'http://localhost:3001'}/accept-invite?token=${inviteToken}`;

            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `You're invited to join ${organizationName}`,
                html: this.generateInviteEmail(inviteUrl, organizationName, invitedBy),
            });

            console.log(`✅ Invitation email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send invitation email:', error);
            throw new Error('Failed to send invitation email');
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(to: string, resetToken: string): Promise<void> {
        try {
            const resetUrl = `${process.env.WEB_APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: 'Reset your password',
                html: this.generatePasswordResetEmail(resetUrl),
            });

            console.log(`✅ Password reset email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    /**
     * Generate invitation email HTML
     */
    private generateInviteEmail(
        inviteUrl: string,
        organizationName: string,
        invitedBy: string
    ): string {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're invited to join ${organizationName}</h2>
            <p>Hi there!</p>
            <p>${invitedBy} has invited you to join <strong>${organizationName}</strong> on Workforce Management.</p>
            <p>Click the button below to set your password and get started:</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${inviteUrl}</p>
            <div class="footer">
              <p>This invitation link will expire in 48 hours.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    /**
     * Generate password reset email HTML
     */
    private generatePasswordResetEmail(resetUrl: string): string {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <div class="footer">
              <p>This password reset link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }
}

export const emailService = new EmailService();
