import express from 'express';
import { PatientModel } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/patients
router.get('/', requireAuth, async (req, res) => {
  const allPatients = (await PatientModel.find())._data || [];
  // Filter by user assignment
  const userPatients = allPatients.filter(p => {
    return (p.nurseIds || []).includes(req.user._id) || (p.familyIds || []).includes(req.user._id);
  });
  res.json(userPatients);
});

// GET /api/patients/:id
router.get('/:id', requireAuth, async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Patient not found.' });
  }

  const isAssigned = (patient.nurseIds || []).includes(req.user._id) || (patient.familyIds || []).includes(req.user._id);
  if (!isAssigned) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied to this patient profile.' });
  }

  res.json(patient);
});

export default router;
