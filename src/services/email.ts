import { Resend } from 'resend';
import { config } from '../config/index';

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName: string
): Promise<void> {
  if (!resend) {
    console.log(`\n📧 PASSWORD RESET for ${to}:\n   ${resetUrl}\n`);
    return;
  }

  const safeName = escapeHtml(userName);

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
}
