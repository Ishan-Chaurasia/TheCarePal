import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { EntryModel } from '../models/index.js';

const router = express.Router();

// GET /api/patients/:id/calendar?month=YYYY-MM
router.get('/:id/calendar', requireAuth, requirePatientAccess, async (req, res) => {
  const patient = req.patient;
  const month = req.query.month || new Date().toISOString().substring(0, 7); // e.g. 2026-11

  const allEntries = (await EntryModel.find({ patientId: patient._id }))._data || [];
  const activeEntries = allEntries.filter(e => !e.isDeleted);

  // Group by day string YYYY-MM-DD
  const daysMap = {};
  for (const entry of activeEntries) {
    const day = entry.day || entry.at?.substring(0, 10);
    if (!day) continue;

    if (!daysMap[day]) {
      daysMap[day] = {
        date: day,
        hasLog: true,
        entryCount: 0,
        hasOutOfRange: false,
        hasMissedDose: false,
        outOfRangeCount: 0,
        missedDoseCount: 0
      };
    }

    daysMap[day].entryCount += 1;
    if (entry.kind === 'vital' && entry.data?.isOutOfRange) {
      daysMap[day].hasOutOfRange = true;
      daysMap[day].outOfRangeCount += 1;
    }
    if (entry.kind === 'medicine' && entry.data?.status === 'missed') {
      daysMap[day].hasMissedDose = true;
      daysMap[day].missedDoseCount += 1;
    }
  }

  res.json({
    month,
    days: daysMap
  });
});

export default router;
