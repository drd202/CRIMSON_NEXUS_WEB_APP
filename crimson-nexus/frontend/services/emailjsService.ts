import emailjs from '@emailjs/browser';
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from '../constants';

// Initialize EmailJS
let isInitialized = false;

export const initEmailJS = () => {
  if (!isInitialized && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE') {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      isInitialized = true;
      console.log('✅ EmailJS initialized successfully');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
    }
  }
};

// Send OTP Email via EmailJS (No CORS issues!)
export const sendOTPEmailJS = async (email: string, otp: string): Promise<boolean> => {
  try {
    // Ensure initialized
    if (!isInitialized) {
      initEmailJS();
    }

    // Check if properly configured
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE' || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID_HERE') {
      console.warn('⚠️ EmailJS not configured. Check constants.ts');
      return false;
    }

    console.log('📧 Sending OTP via EmailJS to:', email);

    const templateParams = {
      to_email: email,
      otp: otp,
      app_name: 'Crimson Nexus',
      from_name: 'Crimson Nexus',
      reply_to: 'crimsonnexus119@gmail.com'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ OTP Email sent successfully:', response.status);
    return response.status === 200;
  } catch (error: any) {
    console.error('❌ EmailJS Error:', error);
    console.error('Error details:', error?.text || error?.message);
    return false;
  }
};
