import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        let serviceAccount;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            // Production: From base64 env var
            const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
            const decoded = Buffer.from(base64, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(decoded);
        } else {
            // Local: From file
            serviceAccount = require('../../firebase-service-account.json');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin initialized');
    } catch (error) {
        console.error('❌ Firebase error:', error);
    }
}

export const firebaseAuth = admin.auth();
