import { Resend } from 'resend';
import { config } from '../config/index';
import { logger } from '../lib/logger';

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

if (!resend && config.NODE_ENV === 'production') {
  logger.warn('RESEND_API_KEY is not set — password reset emails will not be sent in production');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName: string
): Promise<void> {
  if (!resend) {
    logger.info({ to, resetUrl }, 'Password reset email (dev mode)');
    return;
  }

  const safeName = escapeHtml(userName);

  try {
    await resend.emails.send({
      from: config.RESEND_FROM_EMAIL,
      to,
      subject: 'Reset your Skill Gap Analyzer password',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin-bottom: 16px;">Password Reset</h2>
          <p>Hi ${safeName},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : err }, 'Failed to send password reset email');
    throw new Error('Failed to send password reset email');
  }
}
