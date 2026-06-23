import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:3009/ai_publishing';
}
