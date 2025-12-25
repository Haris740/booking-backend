import axios from 'axios';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  // Fast2SMS only supports Indian numbers without +91
  const cleanPhone = phone.replace(/[\+\s\-]/g, '').replace(/^91/, '');
  
  if (cleanPhone.length !== 10) {
    throw new Error('Invalid Indian phone number');
  }

  const message = `Your OTP for Booking App is ${otp}. Valid for 5 minutes. Do not share this code.`;

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'v3',
        sender_id: 'FSTSMS', // Default sender ID
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
        },
      }
    );

    if (response.data.return === false) {
      console.error('Fast2SMS error:', response.data);
      throw new Error('Failed to send SMS');
    }

    console.log('SMS sent successfully:', response.data);
  } catch (error: any) {
    console.error('Fast2SMS error:', error.response?.data || error.message);
    
    // Fallback: Log OTP if SMS fails (development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⚠️ SMS FAILED. OTP for ${phone}: ${otp}`);
    }
    
    throw error;
  }
}

