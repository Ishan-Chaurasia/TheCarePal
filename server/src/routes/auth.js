import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel, PatientModel } from '../models/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const COOKIE_NAME = process.env.COOKIE_NAME || 'carepal_session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid email or password format.' });
    }

    const { email, password } = parse.data;
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });
    }

    const token = signToken(user);

    // Set httpOnly cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also fetch associated patient
    const patient = user.patientId ? await PatientModel.findById(user.patientId) : null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patientId
      },
      patient,
      token // Provided for API testing / Bearer auth fallback
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'An unexpected error occurred during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const patient = req.user.patientId ? await PatientModel.findById(req.user.patientId) : null;
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      patientId: req.user.patientId
    },
    patient
  });
});

export default router;
