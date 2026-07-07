import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};
