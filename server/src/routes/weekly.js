import express from 'express';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { EntryModel, MedicineScheduleModel } from '../models/index.js';

const router = express.Router();

// Helper to get 7 days of a week starting from Monday or given date
function getWeekDateRange(startDateStr) {
  const d = new Date(startDateStr);
  // Find Monday of this week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    dates.push(cur.toISOString().substring(0, 10));
  }
  return dates;
}

// Map mood scale to numeric 1-5 for calculation
const MOOD_MAP = {
  low: 1,
  down: 2,
  steady: 3,
  good: 4,
  cheerful: 5
};
const MOOD_REVERSE = {
  1: 'Low',
  2: 'Down',
  3: 'Steady',
  4: 'Good',
  5: 'Cheerful'
};

function computeWeekMetrics(entries, schedules, dateList) {
  const weekSet = new Set(dateList);
  const weekEntries = entries.filter(e => weekSet.has(e.day) && !e.isDeleted);

  // 1. Medicine adherence
  // Total scheduled = schedules.length * 7
  const scheduledCount = (schedules.length || 4) * 7;
  const medEntries = weekEntries.filter(e => e.kind === 'medicine');
  const givenCount = medEntries.filter(m => m.data?.status === 'given').length;
  const missedCount = medEntries.filter(m => m.data?.status === 'missed').length;
  const adherencePercent = Math.min(100, Math.round((givenCount / scheduledCount) * 100));

  // 2. Meals completed (out of 21 main meals: breakfast, lunch, dinner)
  const mealEntries = weekEntries.filter(e => e.kind === 'meal');
  const mainMeals = mealEntries.filter(m => ['breakfast', 'lunch', 'dinner'].includes(m.data?.mealType?.toLowerCase()));
  const completedMeals = mainMeals.filter(m => m.data?.portion === 'all' || m.data?.portion === 'most').length;

  // 3. Activity minutes
  const activities = weekEntries.filter(e => e.kind === 'activity');
  const totalActivityMinutes = activities.reduce((sum, a) => sum + (Number(a.data?.minutes) || 0), 0);

  // 4. Mood trend (7 points + weekly average)
  const moodPoints = dateList.map(dateStr => {
    const dayMoods = weekEntries.filter(e => e.day === dateStr && e.kind === 'mood');
    if (dayMoods.length === 0) {
      return { date: dateStr, score: null, label: 'No entry' };
    }
    const sum = dayMoods.reduce((acc, m) => {
      const val = MOOD_MAP[m.data?.scale?.toLowerCase()] || 3;
      return acc + val;
    }, 0);
    const avg = Number((sum / dayMoods.length).toFixed(1));
    const rounded = Math.round(avg);
    return {
      date: dateStr,
      score: avg,
      label: MOOD_REVERSE[rounded] || 'Steady'
    };
  });

  const validMoods = moodPoints.filter(m => m.score !== null);
  const weeklyAvgMoodScore = validMoods.length > 0
    ? Number((validMoods.reduce((a, b) => a + b.score, 0) / validMoods.length).toFixed(1))
    : 3.5;
  const weeklyAvgMoodLabel = MOOD_REVERSE[Math.round(weeklyAvgMoodScore)] || 'Steady';

  return {
    adherencePercent,
    givenCount,
    missedCount,
    scheduledCount,
    completedMeals,
    totalMainMealsTarget: 21,
    totalActivityMinutes,
    moodPoints,
    weeklyAvgMoodScore,
    weeklyAvgMoodLabel
  };
}

// GET /api/patients/:id/weekly?weekOf=YYYY-MM-DD
router.get('/:id/weekly', requireAuth, requirePatientAccess, async (req, res) => {
  const patient = req.patient;
  const targetDate = req.query.weekOf || new Date().toISOString().substring(0, 10);

  const currentWeekDates = getWeekDateRange(targetDate);

  // Previous week dates
  const prevWeekMonday = new Date(currentWeekDates[0]);
  prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
  const prevWeekDates = getWeekDateRange(prevWeekMonday.toISOString().substring(0, 10));

  const allEntries = (await EntryModel.find({ patientId: patient._id }))._data || [];
  const schedules = (await MedicineScheduleModel.find({ patientId: patient._id }))._data || [];

  const current = computeWeekMetrics(allEntries, schedules, currentWeekDates);
  const previous = computeWeekMetrics(allEntries, schedules, prevWeekDates);

  res.json({
    weekRange: {
      start: currentWeekDates[0],
      end: currentWeekDates[6]
    },
    current,
    previous,
    diff: {
      adherence: current.adherencePercent - previous.adherencePercent,
      completedMeals: current.completedMeals - previous.completedMeals,
      activityMinutes: current.totalActivityMinutes - previous.totalActivityMinutes,
      moodScore: Number((current.weeklyAvgMoodScore - previous.weeklyAvgMoodScore).toFixed(1))
    }
  });
});

export default router;
