import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';

function checkRequiredEnv(): void {
  const required = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

checkRequiredEnv();
initDb();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT ?? '3000';

app.listen(Number(PORT), () => {
  console.log(`Server listening on port ${PORT}`);
});
