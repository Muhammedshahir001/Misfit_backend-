import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

export const sendOTP = async (to, otp) => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║          MISFITS VERIFICATION OTP        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Email : ${to}`);
  console.log(`║  OTP   : ${otp}`);
  console.log('║  Valid : 10 minutes');
  console.log('╚══════════════════════════════════════════╝');

  const transporter = createTransporter();
  if (transporter) {
    try {
      const mailOptions = {
        from: `"MISFITS Skincare" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${otp} is your MISFITS Verification Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0d0d0d; color: #ffffff; border-radius: 16px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #C9A96E; font-size: 24px; letter-spacing: 2px; margin: 0;">MISFITS</h1>
              <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Indian Intelligence · Modern Science</p>
            </div>
            <div style="background-color: #161616; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #333;">
              <p style="color: #ccc; font-size: 14px; margin-bottom: 12px;">Your Email Verification Code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #C9A96E; margin: 16px 0; background: #221f19; padding: 12px; border-radius: 8px; border: 1px dashed #C9A96E;">
                ${otp}
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 12px;">This code will expire in 10 minutes. Do not share it with anyone.</p>
            </div>
          </div>
        `,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent Successfully] MessageID: ${info.messageId} to ${to}`);
      return info;
    } catch (err) {
      console.error('[Email Send Error]:', err.message);
      return { error: err.message };
    }
  } else {
    console.warn('[Email Warning]: EMAIL_USER or EMAIL_PASS missing in environment variables.');
  }

  return { id: 'console-otp' };
};

