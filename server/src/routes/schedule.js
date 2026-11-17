import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { MedicineScheduleModel, EntryModel } from '../models/index.js';

const router = express.Router();

// GET /api/patients/:id/schedule/:date
router.get('/:id/schedule/:date', requireAuth, requirePatientAccess, async (req, res) => {
  const patient = req.patient;
  const { date } = req.params;

  const schedules = (await MedicineScheduleModel.find({ patientId: patient._id }))._data || [];
  
  // Find logged medicine entries for this day
  const medEntries = (await EntryModel.find({
    patientId: patient._id,
    day: date,
    kind: 'medicine'
  }))._data || [];
  const activeMeds = medEntries.filter(m => !m.isDeleted);

  // Map scheduled doses with their status if already logged
  const scheduleItems = [];
  for (const item of schedules) {
    for (const time of (item.timesOfDay || [])) {
      const existing = activeMeds.find(m => m.data?.scheduleId === item._id && m.data?.scheduledTime === time)
        || activeMeds.find(m => m.data?.medicineName === item.name && m.data?.scheduledTime === time);

      scheduleItems.push({
        scheduleId: item._id,
        name: item.name,
        dose: item.dose,
        scheduledTime: time,
        instructions: item.instructions || '',
        loggedEntry: existing ? {
          id: existing._id,
          status: existing.data?.status,
          givenAt: existing.data?.givenAt || existing.time,
          reason: existing.data?.reason || ''
        } : null
      });
    }
  }

  // Sort by scheduled time
  scheduleItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  res.json({
    date,
    items: scheduleItems
  });
});

export default router;
