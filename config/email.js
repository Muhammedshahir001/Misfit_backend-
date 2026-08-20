import { Resend } from 'resend';

let resend = null;

const getResend = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const sendOTP = async (to, otp) => {
  const client = getResend();

  const { data, error } = await client.emails.send({
    from: 'MISFITS <onboarding@resend.dev>',
    to,
    subject: 'Your MISFITS Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0C0414; padding: 40px; border-radius: 16px; border: 1px solid rgba(253,252,208,0.12);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FDFCD0; font-size: 24px; margin: 0; letter-spacing: 0.1em;">MISFITS</h1>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="color: rgba(253,252,208,0.7); font-size: 14px; margin: 0 0 8px;">Your verification code is</p>
          <div style="font-size: 48px; font-weight: 800; letter-spacing: 0.3em; color: #01FCD3; text-align: center; padding: 20px 0;">${otp}</div>
          <p style="color: rgba(253,252,208,0.5); font-size: 12px; margin: 0;">This code expires in 10 minutes.</p>
        </div>
        <div style="border-top: 1px solid rgba(253,252,208,0.12); padding-top: 20px; text-align: center;">
          <p style="color: rgba(253,252,208,0.4); font-size: 11px; margin: 0;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
