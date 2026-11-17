import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import entriesRoutes from './routes/entries.js';
import dayRoutes from './routes/day.js';
import calendarRoutes from './routes/calendar.js';
import vitalsRoutes from './routes/vitals.js';
import weeklyRoutes from './routes/weekly.js';
import reportRoutes from './routes/report.js';
import scheduleRoutes from './routes/schedule.js';
import uploadRoutes from './routes/uploads.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware - Cloud Deployment Ready CORS
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically echo requesting origin with credentials for cross-domain and same-domain deploys
    callback(null, true);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Ensure DB connected on incoming requests (essential for Vercel serverless cold-starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err);
    next();
  }
});

// Static uploads directory (supports both local disk and serverless /tmp)
const UPLOAD_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {}
}
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patients', entriesRoutes);
app.use('/api/patients', dayRoutes);
app.use('/api/patients', calendarRoutes);
app.use('/api/patients', vitalsRoutes);
app.use('/api/patients', weeklyRoutes);
app.use('/api/patients', reportRoutes);
app.use('/api/patients', scheduleRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
