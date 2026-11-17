import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { EntryModel, MedicineScheduleModel } from '../models/index.js';
import { generateDaySummary } from '../utils/summaryGenerator.js';

const router = express.Router();

// GET /api/patients/:id/day/:date
router.get('/:id/day/:date', requireAuth, requirePatientAccess, async (req, res) => {
  const { date } = req.params; // Format: YYYY-MM-DD
  const patient = req.patient;

  // Retrieve entries for this patient on this day
  const rawEntries = (await EntryModel.find({ patientId: patient._id, day: date }))._data || [];
  const entries = rawEntries.filter(e => !e.isDeleted);

  // Sort by time of care (at timestamp or time string)
  entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Retrieve medicine schedule
  const schedules = (await MedicineScheduleModel.find({ patientId: patient._id }))._data || [];

  // Calculate running water intake
  let runningWaterMl = 0;
  for (const entry of entries) {
    if (entry.kind === 'meal') {
      const water = Number(entry.data?.waterMl) || 0;
      runningWaterMl += water;
      entry.data = entry.data || {};
      entry.data.runningWaterTotal = runningWaterMl;
    }
  }

  // Count flags
  const outOfRangeCount = entries.filter(e => e.kind === 'vital' && e.data?.isOutOfRange).length;
  const missedDosesCount = entries.filter(e => e.kind === 'medicine' && e.data?.status === 'missed').length;

  // Generate deterministic two-sentence day summary
  const summary = generateDaySummary(patient.name, entries, schedules);

  res.json({
    date,
    patient: {
      id: patient._id,
      name: patient.name,
      age: patient.age,
      conditions: patient.conditions
    },
    summary,
    entries,
    stats: {
      totalEntries: entries.length,
      outOfRangeCount,
      missedDosesCount,
      runningWaterMl
    }
  });
});

export default router;
