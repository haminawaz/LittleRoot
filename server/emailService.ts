import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error(
      "Email service not configured. Missing GMAIL_USER or GMAIL_PASSWORD environment variables."
    );
    console.log("EMAIL WOULD BE SENT (but email service not configured):");
    throw new Error(
      "Email service not configured. Please set GMAIL_USER and GMAIL_PASSWORD environment variables."
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export function generatePasswordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset Your LittleRoot Password";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">LittleRoot</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #9333ea; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} LittleRoot. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  const text = `
Reset Your LittleRoot Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} LittleRoot. All rights reserved.
  `;
  return { subject, html, text };
}

export function generateVerificationEmail(
  verificationUrl: string,
  firstName?: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Verify Your LittleRoot Account";
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">LittleRoot</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to LittleRoot!</h2>
        <p>${greeting}</p>
        <p>Thank you for signing up! To get started and access all the amazing features of LittleRoot, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #9333ea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This verification link will expire in 24 hours. If you didn't create an account with LittleRoot, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} LittleRoot. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  const text = `
Verify Your LittleRoot Account

${greeting}

Thank you for signing up! To get started and access all the amazing features of LittleRoot, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account with LittleRoot, you can safely ignore this email.

© ${new Date().getFullYear()} LittleRoot. All rights reserved.
  `;
  return { subject, html, text };
}

export function generateWelcomeEmail(
  firstName?: string,
  planName?: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to LittleRoot - Let's Create Something Amazing!";
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const planInfo = planName
    ? `You're currently on the <strong>${planName}</strong> plan.`
    : "You're currently on the <strong>Free Trial</strong> plan.";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to LittleRoot</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">LittleRoot</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to LittleRoot! 🎉</h2>
        <p>${greeting}</p>
        <p>We're thrilled to have you join our community of storytellers and creators! Your account has been successfully verified, and you're all set to start creating beautiful children's books.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea;">
          <h3 style="color: #9333ea; margin-top: 0;">What You Can Do Now:</h3>
          <ul style="color: #4b5563; padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Create Your First Book:</strong> Transform your stories into stunning illustrated children's books using AI-powered illustrations</li>
            <li style="margin-bottom: 10px;"><strong>Choose Art Styles:</strong> Select from watercolor, digital, cartoon, fantasy, and more artistic styles</li>
            <li style="margin-bottom: 10px;"><strong>Export to PDF:</strong> Download your finished books as high-quality PDFs ready for printing</li>
            <li style="margin-bottom: 10px;"><strong>Character Consistency:</strong> Maintain consistent characters throughout your entire story</li>
          </ul>
        </div>

        <p>${planInfo}</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.FRONTEND_URL || "https://littleroot.com"
          }/dashboard" style="background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Start Creating</a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>💡 Pro Tip:</strong> Check out our template books to get inspired, or start with your own story. The possibilities are endless!</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">If you have any questions or need help getting started, don't hesitate to reach out to our support team. We're here to help!</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} LittleRoot. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  const text = `
Welcome to LittleRoot - Let's Create Something Amazing!

${greeting}

We're thrilled to have you join our community of storytellers and creators! Your account has been successfully verified, and you're all set to start creating beautiful children's books.

What You Can Do Now:
- Create Your First Book: Transform your stories into stunning illustrated children's books using AI-powered illustrations
- Choose Art Styles: Select from watercolor, digital, cartoon, fantasy, and more artistic styles
- Export to PDF: Download your finished books as high-quality PDFs ready for printing
- Character Consistency: Maintain consistent characters throughout your entire story

${planInfo}

Start creating: ${
    process.env.FRONTEND_URL || "https://littleroot.com"
  }/dashboard

💡 Pro Tip: Check out our template books to get inspired, or start with your own story. The possibilities are endless!

If you have any questions or need help getting started, don't hesitate to reach out to our support team. We're here to help!

© ${new Date().getFullYear()} LittleRoot. All rights reserved.
  `;
  return { subject, html, text };
}

export function generateEarlyAccessAdminNotification(
  email: string,
  code: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "New Early Access Signup - LittleRoot";
  const signupDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Early Access Signup</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">LittleRoot Admin</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">🎉 New Early Access Signup</h2>
        <p style="color: #4b5563; font-size: 16px;">A new user has signed up for early access with a 40% discount code.</p>
        
        <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #9333ea; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 120px;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Code:</td>
              <td style="padding: 8px 0;">
                <span style="background: #f3e8ff; color: #9333ea; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-weight: 600; font-size: 14px;">${code}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${signupDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>💡 Note:</strong> This user has been automatically added to the early access list. You can view all signups in the admin dashboard.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || "https://littleroot.com"}/admin/early-access" style="background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View All Signups
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This is an automated notification from LittleRoot Admin System
        </p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
New Early Access Signup - LittleRoot

A new user has signed up for early access with a 40% discount code.

Email: ${email}
Code: ${code}
Date: ${signupDate}

Note: This user has been automatically added to the early access list. You can view all signups in the admin dashboard.

View all signups: ${process.env.FRONTEND_URL || "https://littleroot.com"}/admin/early-access

---
This is an automated notification from LittleRoot Admin System
  `;
  
  return { subject, html, text };
}