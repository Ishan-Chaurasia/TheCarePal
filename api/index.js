import app from '../server/src/app.js';
import { connectDB } from '../server/src/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Vercel serverless connectDB error:', err);
  }
  return app(req, res);
}
