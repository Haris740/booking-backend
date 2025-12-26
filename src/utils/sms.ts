import axios from 'axios';

const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY || '';

interface FirebaseOtpSession {
  sessionInfo: string;
  phoneNumber: string;
}

export async function sendOtpFirebase(phone: string): Promise<FirebaseOtpSession> {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
      {
        phoneNumber: phone,
        recaptchaToken: process.env.FIREBASE_RECAPTCHA_TOKEN || 'test-token',
      }
    );

    return {
      sessionInfo: response.data.sessionInfo,
      phoneNumber: phone,
    };
  } catch (error: any) {
    console.error('Firebase SMS error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP via Firebase');
  }
}

export async function verifyOtpFirebase(
  sessionInfo: string,
  code: string
): Promise<{ idToken: string; refreshToken: string }> {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      {
        sessionInfo,
        code,
      }
    );

    return {
      idToken: response.data.idToken,
      refreshToken: response.data.refreshToken,
    };
  } catch (error: any) {
    console.error('Firebase verification error:', error.response?.data || error.message);
    throw new Error('Invalid OTP');
  }
}

// Fallback: Console log (test mode)
export async function sendOtpTest(phone: string, otp: string): Promise<void> {
  console.log(`📱 TEST MODE - OTP for ${phone}: ${otp}`);
  console.log(`⚠️  Using test mode. Enable Firebase for production.`);
}
