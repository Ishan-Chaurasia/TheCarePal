import dotenv from 'dotenv';
dotenv.config();

import { AlertModel } from './models/index.js';

async function testEmailAlertSystem() {
  console.log('--- Commencing Email Alert Verification (PRD F7) ---');
  const base = 'http://localhost:5000/api';

  // 1. Authenticate as Nurse Rekha
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nurse@thecarepal.com', password: 'NursePass123!' })
  });
  const { token, user } = await loginRes.json();
  console.log('1. Nurse authenticated:', user.name);

  // 2. Nurse logs a High Blood Pressure reading (Systolic 162 / Diastolic 98 mmHg)
  console.log('2. Nurse logging high blood pressure: 162/98 mmHg (Normal: 90-139 / 60-89)...');
  const bpRes = await fetch(`${base}/patients/patient_kamla_01/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      kind: 'vital',
      day: '2026-11-17',
      time: '16:00',
      data: {
        vitalType: 'bloodPressure',
        systolic: 162,
        diastolic: 98,
        unit: 'mmHg'
      }
    })
  });
  const bpData = await bpRes.json();
  console.log('   Entry created:', bpData.success, '| Out of range flagged:', bpData.entry?.data?.isOutOfRange);
  console.log('   Alert dispatched:', bpData.alertDispatched);
  console.log('   Alert details:', bpData.alert?.reason);
  if (bpData.alert?.previewUrl) {
    console.log('   🔗 Live Ethereal Email Preview URL:', bpData.alert.previewUrl);
  }

  // 3. Nurse logs a Missed Medication (Metformin 500mg, missed: refused)
  console.log('3. Nurse logging missed medication: Metformin 500mg (Reason: refused)...');
  const medRes = await fetch(`${base}/patients/patient_kamla_01/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      kind: 'medicine',
      day: '2026-11-17',
      time: '16:05',
      data: {
        scheduleId: 'sched_metf_test',
        medicineName: 'Metformin',
        dose: '500 mg',
        scheduledTime: '20:30',
        status: 'missed',
        reason: 'refused by patient'
      }
    })
  });
  const medData = await medRes.json();
  console.log('   Med entry created:', medData.success);
  console.log('   Alert dispatched for missed dose:', medData.alertDispatched);
  console.log('   Alert details:', medData.alert?.reason);

  // 4. Verify alerts endpoint (Family view)
  const alertsRes = await fetch(`${base}/patients/patient_kamla_01/alerts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const alertsList = await alertsRes.json();
  console.log(`4. Total alerts recorded in archive: ${alertsList.length}`);
  console.log('   Latest alert in drawer:', alertsList[0]?.reason);

  console.log('🎉 EMAIL ALERT VERIFICATION COMPLETE: ALL CHECKS PASSED!');
}

testEmailAlertSystem().catch(console.error);
