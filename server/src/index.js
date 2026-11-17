import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
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
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Static uploads directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');
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

// Serve frontend in production if built
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('CarePal API Server running. Open Vite frontend on port 5173.');
    }
  });
});

// Start Server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`CarePal API Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

start();
