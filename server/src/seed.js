import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import {
  UserModel,
  PatientModel,
  MedicineScheduleModel,
  EntryModel,
  EntryAuditModel,
  AlertModel
} from './models/index.js';
import { checkVitalOutOfRange } from './utils/vitalRanges.js';

dotenv.config();

const NURSE_PASS = process.env.NURSE_SEED_PASSWORD || 'NursePass123!';
const FAMILY_PASS = process.env.FAMILY_SEED_PASSWORD || 'FamilyPass123!';

export async function runSeed() {
  await connectDB();
  console.log('--- Commencing Seed for TheCarePal (FS-03) ---');

  // 1. Clear existing collections
  await UserModel.deleteMany({});
  await PatientModel.deleteMany({});
  await MedicineScheduleModel.deleteMany({});
  await EntryModel.deleteMany({});
  await EntryAuditModel.deleteMany({});
  await AlertModel.deleteMany({});

  const nurseHash = await bcrypt.hash(NURSE_PASS, 10);
  const familyHash = await bcrypt.hash(FAMILY_PASS, 10);

  // 2. Create Patient: Kamla Sharma
  const patient = await PatientModel.create({
    _id: 'patient_kamla_01',
    name: 'Kamla Sharma',
    age: 78,
    gender: 'Female',
    location: 'Bhopal, Madhya Pradesh',
    conditions: ['Hypertension', 'Type 2 Diabetes', 'Early Memory Loss'],
    emergencyContact: {
      name: 'Neha Sharma (Daughter)',
      phone: '+91 98450 12345',
      city: 'Bengaluru'
    },
    nurseIds: [],
    familyIds: []
  });

  // 3. Create Users
  const nurseUser = await UserModel.create({
    _id: 'user_nurse_rekha',
    name: 'Rekha Yadav',
    email: 'nurse@thecarepal.com',
    passwordHash: nurseHash,
    role: 'nurse',
    patientId: patient._id
  });

  const familyUser = await UserModel.create({
    _id: 'user_family_neha',
    name: 'Neha Sharma',
    email: 'family@thecarepal.com',
    passwordHash: familyHash,
    role: 'family',
    patientId: patient._id
  });

  // Link patient to users
  await PatientModel.findByIdAndUpdate(patient._id, {
    nurseIds: [nurseUser._id],
    familyIds: [familyUser._id]
  });

  // 4. Create Medicine Schedule
  const scheduleItems = [
    {
      _id: 'sched_amlo_0830',
      patientId: patient._id,
      name: 'Amlodipine',
      dose: '5 mg',
      timesOfDay: ['08:30'],
      instructions: 'After breakfast for blood pressure'
    },
    {
      _id: 'sched_metf_1330',
      patientId: patient._id,
      name: 'Metformin',
      dose: '500 mg',
      timesOfDay: ['13:30'],
      instructions: 'With or immediately after lunch'
    },
    {
      _id: 'sched_metf_2030',
      patientId: patient._id,
      name: 'Metformin',
      dose: '500 mg',
      timesOfDay: ['20:30'],
      instructions: 'With dinner'
    },
    {
      _id: 'sched_atorv_2100',
      patientId: patient._id,
      name: 'Atorvastatin',
      dose: '10 mg',
      timesOfDay: ['21:00'],
      instructions: 'At bedtime with water'
    }
  ];
  for (const s of scheduleItems) {
    await MedicineScheduleModel.create(s);
  }

  // 5. Generate 45 Days of Synthetic Clinical History
  // Anchor date: 2026-11-17 (Tuesday)
  const anchorDate = new Date('2026-11-17T12:00:00+05:30');
  const allEntries = [];

  for (let offset = 44; offset >= 0; offset--) {
    const curDate = new Date(anchorDate);
    curDate.setDate(anchorDate.getDate() - offset);
    const dayStr = curDate.toISOString().substring(0, 10);
    const isToday = (offset === 0);

    // Drifting BP window: days 38 to 32 ago (BP drifted high) and today (one high reading)
    const isDriftHighBpDay = (offset >= 6 && offset <= 11) || isToday;
    const isSugarSpikeDay = (offset === 4 || offset === 19 || offset === 31);
    const isMissedMedDay1 = (offset === 0); // Today Metformin missed: refused
    const isMissedMedDay2 = (offset === 14); // 2 weeks ago: unavailable
    const isMissedMedDay3 = (offset === 28); // 4 weeks ago: nauseous
    const isMoodDipDay = (offset >= 18 && offset <= 22);

    // Entry 1: Morning Vitals (07:40 - 08:00)
    let sys = isDriftHighBpDay ? 148 : Math.floor(120 + ((offset * 7) % 16));
    let dia = isDriftHighBpDay ? 92 : Math.floor(74 + ((offset * 3) % 12));
    let pulse = 74 + ((offset * 5) % 16);
    let spo2 = 97 + ((offset * 2) % 3);
    let fastingSugar = 102 + ((offset * 9) % 24);
    let temp = (98.2 + ((offset % 5) * 0.1)).toFixed(1);

    const bpCheck = checkVitalOutOfRange('bloodPressure', null, { systolic: sys, diastolic: dia });
    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '07:40',
      at: `${dayStr}T07:40:00+05:30`,
      data: {
        vitalType: 'bloodPressure',
        systolic: sys,
        diastolic: dia,
        unit: 'mmHg',
        ...bpCheck
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name,
      photos: []
    });

    const pulseCheck = checkVitalOutOfRange('pulse', pulse);
    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '07:42',
      at: `${dayStr}T07:42:00+05:30`,
      data: {
        vitalType: 'pulse',
        value: pulse,
        unit: 'bpm',
        ...pulseCheck
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '07:45',
      at: `${dayStr}T07:45:00+05:30`,
      data: {
        vitalType: 'spo2',
        value: spo2,
        unit: '%',
        ...checkVitalOutOfRange('spo2', spo2)
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '07:50',
      at: `${dayStr}T07:50:00+05:30`,
      data: {
        vitalType: 'bloodSugar',
        value: fastingSugar,
        unit: 'mg/dL',
        timing: 'fasting',
        ...checkVitalOutOfRange('bloodSugar', fastingSugar, { timing: 'fasting' })
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 2: Breakfast (08:15)
    allEntries.push({
      patientId: patient._id,
      kind: 'meal',
      day: dayStr,
      time: '08:15',
      at: `${dayStr}T08:15:00+05:30`,
      data: {
        mealType: 'breakfast',
        items: isToday ? 'Poha, warm tea' : (offset % 2 === 0 ? 'Idli with sambar, warm milk' : 'Upma, apple slices, tea'),
        portion: 'all',
        waterMl: 250
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 3: Morning Medicine (08:32)
    allEntries.push({
      patientId: patient._id,
      kind: 'medicine',
      day: dayStr,
      time: '08:32',
      at: `${dayStr}T08:32:00+05:30`,
      data: {
        scheduleId: 'sched_amlo_0830',
        medicineName: 'Amlodipine',
        dose: '5 mg',
        scheduledTime: '08:30',
        givenAt: '08:32',
        status: 'given'
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 4: Morning Observation (10:40)
    allEntries.push({
      patientId: patient._id,
      kind: 'observation',
      day: dayStr,
      time: '10:40',
      at: `${dayStr}T10:40:00+05:30`,
      data: {
        text: isToday
          ? 'She asked about her son twice and settled after a cup of tea.'
          : (offset % 3 === 0
            ? 'Engaged warmly in conversation about old family photographs. Looked comfortable.'
            : 'Completed morning breathing exercises gently. Reminded her about drinking warm water.')
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 5: Lunch (13:05)
    allEntries.push({
      patientId: patient._id,
      kind: 'meal',
      day: dayStr,
      time: '13:05',
      at: `${dayStr}T13:05:00+05:30`,
      data: {
        mealType: 'lunch',
        items: isToday ? 'Dal, two rotis' : 'Moong dal, steamed rice, cooked spinach',
        portion: isToday ? 'half' : (isMoodDipDay ? 'half' : 'most'),
        waterMl: 300
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 6: Post-lunch Medicine (13:30)
    if (isMissedMedDay1) {
      allEntries.push({
        patientId: patient._id,
        kind: 'medicine',
        day: dayStr,
        time: '13:30',
        at: `${dayStr}T13:30:00+05:30`,
        data: {
          scheduleId: 'sched_metf_1330',
          medicineName: 'Metformin',
          dose: '500 mg',
          scheduledTime: '13:30',
          status: 'missed',
          reason: 'refused'
        },
        authorId: nurseUser._id,
        authorName: nurseUser.name
      });
    } else if (isMissedMedDay2) {
      allEntries.push({
        patientId: patient._id,
        kind: 'medicine',
        day: dayStr,
        time: '13:30',
        at: `${dayStr}T13:30:00+05:30`,
        data: {
          scheduleId: 'sched_metf_1330',
          medicineName: 'Metformin',
          dose: '500 mg',
          scheduledTime: '13:30',
          status: 'missed',
          reason: 'unavailable'
        },
        authorId: nurseUser._id,
        authorName: nurseUser.name
      });
    } else if (isMissedMedDay3) {
      allEntries.push({
        patientId: patient._id,
        kind: 'medicine',
        day: dayStr,
        time: '13:30',
        at: `${dayStr}T13:30:00+05:30`,
        data: {
          scheduleId: 'sched_metf_1330',
          medicineName: 'Metformin',
          dose: '500 mg',
          scheduledTime: '13:30',
          status: 'missed',
          reason: 'nauseous'
        },
        authorId: nurseUser._id,
        authorName: nurseUser.name
      });
    } else {
      allEntries.push({
        patientId: patient._id,
        kind: 'medicine',
        day: dayStr,
        time: '13:35',
        at: `${dayStr}T13:35:00+05:30`,
        data: {
          scheduleId: 'sched_metf_1330',
          medicineName: 'Metformin',
          dose: '500 mg',
          scheduledTime: '13:30',
          givenAt: '13:35',
          status: 'given'
        },
        authorId: nurseUser._id,
        authorName: nurseUser.name
      });
    }

    // Entry 7: Afternoon Blood Sugar (15:30)
    let postSugar = isSugarSpikeDay ? 194 : Math.floor(136 + ((offset * 5) % 36));
    const sugarCheck = checkVitalOutOfRange('bloodSugar', postSugar, { timing: 'afterMeal' });
    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '15:30',
      at: `${dayStr}T15:30:00+05:30`,
      data: {
        vitalType: 'bloodSugar',
        value: postSugar,
        unit: 'mg/dL',
        timing: 'afterMeal',
        ...sugarCheck
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 8: Afternoon Activity (16:30)
    const actMins = isToday ? 25 : (offset % 2 === 0 ? 30 : 20);
    allEntries.push({
      patientId: patient._id,
      kind: 'activity',
      day: dayStr,
      time: '16:30',
      at: `${dayStr}T16:30:00+05:30`,
      data: {
        activityType: offset % 2 === 0 ? 'Physiotherapy' : 'Walk',
        minutes: actMins,
        notes: offset % 2 === 0 ? 'Assisted leg lifts and knee extensions' : 'Garden walk with walker support'
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 9: Mood (17:30)
    const moodScale = isMoodDipDay ? 'down' : (offset % 4 === 0 ? 'cheerful' : (offset % 3 === 0 ? 'good' : 'steady'));
    allEntries.push({
      patientId: patient._id,
      kind: 'mood',
      day: dayStr,
      time: '17:30',
      at: `${dayStr}T17:30:00+05:30`,
      data: {
        scale: moodScale,
        context: isMoodDipDay ? 'felt homesick' : 'rested peacefully'
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 10: Dinner (20:00)
    allEntries.push({
      patientId: patient._id,
      kind: 'meal',
      day: dayStr,
      time: '20:00',
      at: `${dayStr}T20:00:00+05:30`,
      data: {
        mealType: 'dinner',
        items: 'Vegetable khichdi, curd',
        portion: 'all',
        waterMl: 250
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 11: Dinner Medicine (20:30)
    allEntries.push({
      patientId: patient._id,
      kind: 'medicine',
      day: dayStr,
      time: '20:32',
      at: `${dayStr}T20:32:00+05:30`,
      data: {
        scheduleId: 'sched_metf_2030',
        medicineName: 'Metformin',
        dose: '500 mg',
        scheduledTime: '20:30',
        givenAt: '20:32',
        status: 'given'
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 12: Bedtime Medicine (21:00)
    allEntries.push({
      patientId: patient._id,
      kind: 'medicine',
      day: dayStr,
      time: '21:05',
      at: `${dayStr}T21:05:00+05:30`,
      data: {
        scheduleId: 'sched_atorv_2100',
        medicineName: 'Atorvastatin',
        dose: '10 mg',
        scheduledTime: '21:00',
        givenAt: '21:05',
        status: 'given'
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });

    // Entry 13: Evening Temp & Pulse (21:15)
    allEntries.push({
      patientId: patient._id,
      kind: 'vital',
      day: dayStr,
      time: '21:15',
      at: `${dayStr}T21:15:00+05:30`,
      data: {
        vitalType: 'temperature',
        value: Number(temp),
        unit: '°F',
        ...checkVitalOutOfRange('temperature', Number(temp))
      },
      authorId: nurseUser._id,
      authorName: nurseUser.name
    });
  }

  // Insert all entries
  await EntryModel.insertMany(allEntries);

  console.log(`✅ Seed finished successfully!`);
  console.log(`- Patient: Kamla Sharma (ID: ${patient._id})`);
  console.log(`- Nurse: nurse@thecarepal.com / ${NURSE_PASS}`);
  console.log(`- Family: family@thecarepal.com / ${FAMILY_PASS}`);
  console.log(`- Total Entries Seeded: ${allEntries.length} entries across 45 days.`);
}

// Auto-run if executed directly via node src/seed.js
runSeed().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
