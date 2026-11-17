import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';
import { connectDB } from './db.js';
import { UserModel } from './models/index.js';
import { runSeed } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Serve frontend in production if built
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('CarePal API Server running. Frontend build not found.');
    }
  });
});

// Start Server
async function start() {
  await connectDB();

  // Auto-seed if database is completely empty (e.g. brand new MongoDB Atlas cluster)
  try {
    const userCount = await UserModel.countDocuments({});
    if (userCount === 0) {
      console.log('Database empty: auto-seeding patient Kamla Sharma and 45 days of clinical history...');
      await runSeed();
      console.log('✅ Auto-seed completed successfully.');
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`CarePal Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

start();
