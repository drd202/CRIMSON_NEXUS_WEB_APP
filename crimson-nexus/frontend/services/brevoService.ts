
import { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } from '../constants';

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  if (!BREVO_API_KEY) {
    console.warn("Brevo API Key missing.");
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: email }],
        subject: `${otp} is your Crimson Nexus verification code`,
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f4f4f4;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <h1 style="color: #dc143c; text-align: center; font-size: 28px; margin-bottom: 10px; font-weight: 800; letter-spacing: -1px;">Crimson Nexus</h1>
                <p style="text-align: center; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px;">Secure Verification</p>
                
                <div style="text-align: center; margin-bottom: 40px;">
                    <p style="color: #333; margin-bottom: 20px; font-size: 16px;">Use the following One-Time Password (OTP) to complete your registration:</p>
                    <div style="background: #dc143c; color: white; padding: 20px 40px; font-size: 36px; font-weight: bold; letter-spacing: 8px; display: inline-block; border-radius: 12px; box-shadow: 0 10px 25px rgba(220, 20, 60, 0.3);">${otp}</div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #999; line-height: 1.5;">This code will expire in 10 minutes.<br/>If you didn't request this code, please ignore this email.</p>
                </div>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      console.error('Brevo API Error:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Network Error sending OTP:', error);
    return false;
  }
};
