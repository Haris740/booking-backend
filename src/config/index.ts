import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL!,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
} as const;
