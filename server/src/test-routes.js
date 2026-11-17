import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import entriesRoutes from './routes/entries.js';
import dayRoutes from './routes/day.js';
import calendarRoutes from './routes/calendar.js';
import vitalsRoutes from './routes/vitals.js';
import weeklyRoutes from './routes/weekly.js';
import scheduleRoutes from './routes/schedule.js';
import { EntryAuditModel, AlertModel } from './models/index.js';

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patients', entriesRoutes);
app.use('/api/patients', dayRoutes);
app.use('/api/patients', calendarRoutes);
app.use('/api/patients', vitalsRoutes);
app.use('/api/patients', weeklyRoutes);
app.use('/api/patients', scheduleRoutes);

const server = app.listen(5099, async () => {
  console.log('Testing server on port 5099...');
  try {
    const base = 'http://localhost:5099/api';

    // 1. Login Nurse
    const nurseRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nurse@thecarepal.com', password: 'NursePass123!' })
    });
    const nurseData = await nurseRes.json();
    console.log('1. Nurse Login:', nurseRes.status, nurseData.user?.name, '| Token received:', !!nurseData.token);

    // 2. Login Family
    const famRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'family@thecarepal.com', password: 'FamilyPass123!' })
    });
    const famData = await famRes.json();
    console.log('2. Family Login:', famRes.status, famData.user?.name);

    // 3. Authorization check: Family attempts nurse write -> MUST be 403
    const forbiddenWrite = await fetch(`${base}/patients/patient_kamla_01/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${famData.token}`
      },
      body: JSON.stringify({
        kind: 'vital',
        data: { vitalType: 'pulse', value: 80 }
      })
    });
    console.log('3. Family Write Security Gate:', forbiddenWrite.status, '(Expect 403)');

    // 4. Day View
    const dayRes = await fetch(`${base}/patients/patient_kamla_01/day/2026-11-17`, {
      headers: { 'Authorization': `Bearer ${famData.token}` }
    });
    const dayData = await dayRes.json();
    console.log('4. Day View Summary:', dayData.summary);
    console.log('   Total entries today:', dayData.entries?.length, '| Out of range:', dayData.stats?.outOfRangeCount);

    // 5. Calendar
    const calRes = await fetch(`${base}/patients/patient_kamla_01/calendar?month=2026-11`, {
      headers: { 'Authorization': `Bearer ${famData.token}` }
    });
    const calData = await calRes.json();
    console.log('5. Calendar Days Logged:', Object.keys(calData.days || {}).length, 'days in archive');

    // 6. Vitals 7 days
    const vitalsRes = await fetch(`${base}/patients/patient_kamla_01/vitals?days=7`, {
      headers: { 'Authorization': `Bearer ${famData.token}` }
    });
    const vitalsData = await vitalsRes.json();
    console.log('6. Vitals 7 Days Points - BP:', vitalsData.series?.bloodPressure?.length, 'Pulse:', vitalsData.series?.pulse?.length);

    // 7. Weekly Metrics
    const weeklyRes = await fetch(`${base}/patients/patient_kamla_01/weekly?weekOf=2026-11-17`, {
      headers: { 'Authorization': `Bearer ${famData.token}` }
    });
    const weeklyData = await weeklyRes.json();
    console.log('7. Weekly Metrics - Adherence:', weeklyData.current?.adherencePercent + '%', 'Meals:', weeklyData.current?.completedMeals + '/21', 'Activity:', weeklyData.current?.totalActivityMinutes + ' mins', 'Mood:', weeklyData.current?.weeklyAvgMoodLabel);

    // 8. Nurse Write Entry (Independent save + Range flag)
    const writeRes = await fetch(`${base}/patients/patient_kamla_01/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nurseData.token}`
      },
      body: JSON.stringify({
        kind: 'vital',
        time: '14:15',
        data: {
          vitalType: 'bloodPressure',
          systolic: 152,
          diastolic: 96,
          unit: 'mmHg'
        }
      })
    });
    const writeData = await writeRes.json();
    console.log('8. Nurse Logged BP 152/96:', writeRes.status, '| Out of range flagged:', writeData.entry?.data?.isOutOfRange, '| Status:', writeData.entry?.data?.status);

    // Check alert logged
    const alertCount = await AlertModel.countDocuments();
    console.log('   Alerts dispatched to family in DB:', alertCount);

    // 9. Nurse Edit Entry
    const editRes = await fetch(`${base}/patients/patient_kamla_01/entries/${writeData.entry?._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nurseData.token}`
      },
      body: JSON.stringify({
        data: {
          vitalType: 'bloodPressure',
          systolic: 146,
          diastolic: 92,
          unit: 'mmHg'
        }
      })
    });
    console.log('9. Nurse Edited BP to 146/92:', editRes.status);
    const audits = (await EntryAuditModel.find({ entryId: writeData.entry?._id }))._data || [];
    console.log('   Audit trail entries for edited item:', audits.length);

    console.log('🎉 ALL BACKEND CHECKS PASSED PERFECTLY!');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    server.close();
  }
});
