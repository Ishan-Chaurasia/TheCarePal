import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { EntryModel, MedicineScheduleModel } from '../models/index.js';
import { buildReportPDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// GET /api/patients/:id/report?days=30
router.get('/:id/report', requireAuth, requirePatientAccess, async (req, res) => {
  const patient = req.patient;
  const daysLimit = parseInt(req.query.days, 10) || 30;

  const now = new Date();
  const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().substring(0, 10);
  const todayStr = now.toISOString().substring(0, 10);

  const allEntries = (await EntryModel.find({ patientId: patient._id }))._data || [];
  const entries = allEntries.filter(e => !e.isDeleted && e.day >= cutoffStr);
  const schedules = (await MedicineScheduleModel.find({ patientId: patient._id }))._data || [];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="carepal-report-${patient.name.toLowerCase().replace(/\s+/g, '-')}-30days.pdf"`);

  buildReportPDF({
    patient,
    entries,
    scheduledDoses: schedules,
    generatedBy: req.user.name + ` (${req.user.role})`,
    startDate: cutoffStr,
    endDate: todayStr
  }, res);
});

export default router;
