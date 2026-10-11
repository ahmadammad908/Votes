import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create transporter once
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for port 465, false for others
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

/**
 * Send a 6-digit OTP verification email
 */
export async function sendVerificationEmail(to: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; background: #0f0f17; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo span { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h2 { text-align: center; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        p { color: #9ca3af; font-size: 14px; text-align: center; line-height: 1.6; }
        .otp-box { margin: 32px auto; text-align: center; background: #0f0f17; border: 1px solid rgba(168,85,247,0.4); border-radius: 12px; padding: 24px; width: fit-content; }
        .otp { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #a855f7; }
        .expires { font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center; }
        .warning { font-size: 12px; color: #ef4444; text-align: center; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo"><span>🔥 CampusFace</span></div>
        <h2>Verify Your Email Address</h2>
        <p>Use the code below to verify your university email and complete registration.</p>
        <div class="otp-box">
          <div class="otp">${otp}</div>
        </div>
        <p class="expires">⏱ This code expires in <strong>10 minutes</strong>.</p>
        <p class="warning">If you did not request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: `${otp} - Your CampusFace Verification Code`,
    html
  });
}
