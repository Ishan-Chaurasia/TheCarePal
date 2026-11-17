import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { EntryModel } from '../models/index.js';
import { DEFAULT_RANGES } from '../utils/vitalRanges.js';

const router = express.Router();

// GET /api/patients/:id/vitals?days=7|30
router.get('/:id/vitals', requireAuth, requirePatientAccess, async (req, res) => {
  const patient = req.patient;
  const daysLimit = parseInt(req.query.days, 10) || 7;

  // Compute cutoff date
  const now = new Date();
  const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  const allEntries = (await EntryModel.find({ patientId: patient._id, kind: 'vital' }))._data || [];
  const vitals = allEntries.filter(e => !e.isDeleted && e.day >= cutoffStr);

  vitals.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Group vitals into clean series for Recharts
  const bloodPressureSeries = [];
  const pulseSeries = [];
  const spo2Series = [];
  const bloodSugarSeries = [];
  const temperatureSeries = [];

  for (const v of vitals) {
    const timeLabel = (v.day ? v.day.substring(5) : '') + ' ' + (v.time || (v.at ? v.at.substring(11, 16) : ''));
    const basePoint = {
      id: v._id,
      day: v.day,
      at: v.at,
      timeLabel,
      isOutOfRange: !!v.data?.isOutOfRange,
      status: v.data?.status || 'normal',
      crossedEdge: v.data?.crossedEdge || ''
    };

    const vt = v.data?.vitalType;
    if (vt === 'bloodPressure') {
      const sys = Number(v.data?.systolic || v.data?.value?.systolic);
      const dia = Number(v.data?.diastolic || v.data?.value?.diastolic);
      bloodPressureSeries.push({
        ...basePoint,
        systolic: sys,
        diastolic: dia,
        label: `${sys}/${dia} mmHg`
      });
    } else if (vt === 'pulse') {
      const val = Number(v.data?.value);
      pulseSeries.push({
        ...basePoint,
        pulse: val,
        label: `${val} bpm`
      });
    } else if (vt === 'spo2') {
      const val = Number(v.data?.value);
      spo2Series.push({
        ...basePoint,
        spo2: val,
        label: `${val}%`
      });
    } else if (vt === 'bloodSugar') {
      const val = Number(v.data?.value);
      bloodSugarSeries.push({
        ...basePoint,
        bloodSugar: val,
        timing: v.data?.timing || 'fasting',
        label: `${val} mg/dL (${v.data?.timing || 'fasting'})`
      });
    } else if (vt === 'temperature') {
      const val = Number(v.data?.value);
      temperatureSeries.push({
        ...basePoint,
        temperature: val,
        label: `${val}°F`
      });
    }
  }

  res.json({
    days: daysLimit,
    bands: DEFAULT_RANGES,
    series: {
      bloodPressure: bloodPressureSeries,
      pulse: pulseSeries,
      spo2: spo2Series,
      bloodSugar: bloodSugarSeries,
      temperature: temperatureSeries
    }
  });
});

export default router;
