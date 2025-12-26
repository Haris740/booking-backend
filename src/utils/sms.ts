import axios from 'axios';

const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY || '';

interface FirebaseSession {
  sessionInfo: string;
}

export async function sendOtpFirebase(phone: string): Promise<FirebaseSession> {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
      {
        phoneNumber: phone,
        recaptchaToken: 'test-recaptcha-token', // Works for test numbers
      }
    );

    console.log(`✅ Firebase OTP sent to ${phone}`);
    
    return {
      sessionInfo: response.data.sessionInfo,
    };
  } catch (error: any) {
    console.error('❌ Firebase error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send OTP');
  }
}

export async function verifyOtpFirebase(
  sessionInfo: string,
  code: string
): Promise<void> {
  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      {
        sessionInfo,
        code,
      }
    );

    console.log(`✅ Firebase OTP verified`);
  } catch (error: any) {
    console.error('❌ Firebase verification error:', error.response?.data || error.message);
    throw new Error('Invalid OTP');
  }
}