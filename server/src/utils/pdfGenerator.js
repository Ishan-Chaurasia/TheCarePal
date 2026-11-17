import PDFDocument from 'pdfkit';

/**
 * Builds the doctor-facing 30-day PDF report.
 * Formatted cleanly for both color screens and black-and-white printing.
 */
export function buildReportPDF({ patient, entries, scheduledDoses, generatedBy, startDate, endDate }, res) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: `CarePal 30-Day Clinical Summary - ${patient.name}`,
      Author: 'TheCarePal System',
      Subject: 'Patient Daily Care History'
    }
  });

  doc.pipe(res);

  // Palette constants matching tokens
  const cDarkStone = '#3A342D';
  const cDeepAqua = '#17707F';
  const cAquaTint = '#D3ECF0';
  const cCorrectionRed = '#B3261E';
  const cWarmStone = '#7A7268';
  const cLightStone = '#D9D3CA';

  // --- HEADER SECTION ---
  doc.fontSize(22).font('Helvetica-Bold').fillColor(cDarkStone).text('TheCarePal · 30-Day Care History Report', 40, 40);
  doc.fontSize(10).font('Helvetica').fillColor(cWarmStone).text(`Reporting Period: ${startDate} to ${endDate}  |  Generated on: ${new Date().toLocaleDateString('en-GB')} by ${generatedBy}`, 40, 68);

  doc.moveTo(40, 84).lineTo(555, 84).strokeColor(cLightStone).lineWidth(1).stroke();

  // Patient Info Box
  doc.rect(40, 95, 515, 60).fillAndStroke('#F8F9FA', cLightStone);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(cDarkStone).text(`Patient: ${patient.name}, ${patient.age} years`, 55, 105);
  doc.fontSize(10).font('Helvetica').fillColor(cDarkStone).text(`Known Conditions: ${patient.conditions ? patient.conditions.join(', ') : 'None listed'}`, 55, 122);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor(cWarmStone).text('Assigned Nurse: Rekha Yadav  |  Linked Family: Neha Sharma', 55, 137);

  let currentY = 175;

  // --- SECTION 1: VITALS SUMMARY & OUT-OF-RANGE LOG ---
  doc.fontSize(14).font('Helvetica-Bold').fillColor(cDeepAqua).text('1. Vital Signs Summary (30 Days)', 40, currentY);
  currentY += 20;

  // Filter vitals
  const vitals = entries.filter(e => e.kind === 'vital' && !e.isDeleted);
  const outOfRangeVitals = vitals.filter(v => v.data?.isOutOfRange);

  // Vitals Table Header
  doc.rect(40, currentY, 515, 20).fill('#EAECEB');
  doc.fontSize(9).font('Helvetica-Bold').fillColor(cDarkStone);
  doc.text('Vital Sign', 50, currentY + 6);
  doc.text('Target Normal Band', 180, currentY + 6);
  doc.text('Readings Taken', 320, currentY + 6);
  doc.text('Min / Max / Avg', 410, currentY + 6);
  currentY += 24;

  const vitalTypes = [
    { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', band: '90-139 / 60-89' },
    { key: 'pulse', label: 'Pulse Rate', unit: 'bpm', band: '60 - 100' },
    { key: 'spo2', label: 'Oxygen (SpO2)', unit: '%', band: '94 - 100' },
    { key: 'bloodSugar', label: 'Blood Sugar', unit: 'mg/dL', band: 'Fasting: 70-130, Post: <180' },
    { key: 'temperature', label: 'Temperature', unit: '°F', band: '97.0 - 99.5' }
  ];

  for (const vt of vitalTypes) {
    const list = vitals.filter(v => v.data?.vitalType === vt.key);
    let minMaxAvg = 'N/A';
    if (vt.key === 'bloodPressure' && list.length > 0) {
      const sysVals = list.map(v => Number(v.data?.systolic || v.data?.value?.systolic)).filter(n => !isNaN(n));
      const diaVals = list.map(v => Number(v.data?.diastolic || v.data?.value?.diastolic)).filter(n => !isNaN(n));
      if (sysVals.length > 0) {
        const avgSys = Math.round(sysVals.reduce((a, b) => a + b, 0) / sysVals.length);
        const avgDia = Math.round(diaVals.reduce((a, b) => a + b, 0) / diaVals.length);
        minMaxAvg = `Avg: ${avgSys}/${avgDia} mmHg`;
      }
    } else if (list.length > 0) {
      const vals = list.map(v => Number(v.data?.value)).filter(n => !isNaN(n));
      if (vals.length > 0) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        minMaxAvg = `${min} / ${max} / ${avg} ${vt.unit}`;
      }
    }

    doc.rect(40, currentY, 515, 18).strokeColor('#F0F0F0').lineWidth(0.5).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(cDarkStone);
    doc.text(vt.label, 50, currentY + 4);
    doc.text(vt.band, 180, currentY + 4);
    doc.text(`${list.length} logged`, 320, currentY + 4);
    doc.text(minMaxAvg, 410, currentY + 4);
    currentY += 19;
  }

  // Out of range table
  currentY += 10;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(cDarkStone).text(`Out-of-Range Incidents (${outOfRangeVitals.length} total)`, 40, currentY);
  currentY += 16;

  if (outOfRangeVitals.length === 0) {
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(cWarmStone).text('No out-of-range readings recorded in this 30-day window.', 50, currentY);
    currentY += 20;
  } else {
    // Show top 8 out of range readings
    doc.rect(40, currentY, 515, 16).fill('#FFF5F5');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(cCorrectionRed);
    doc.text('Date & Time (IST)', 50, currentY + 4);
    doc.text('Vital Type', 180, currentY + 4);
    doc.text('Recorded Value', 300, currentY + 4);
    doc.text('Flag & Deviation', 410, currentY + 4);
    currentY += 18;

    for (const oor of outOfRangeVitals.slice(0, 8)) {
      doc.fontSize(8).font('Helvetica').fillColor(cDarkStone);
      const timeStr = new Date(oor.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + (oor.time || new Date(oor.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      const valStr = oor.data?.vitalType === 'bloodPressure' ? `${oor.data?.systolic}/${oor.data?.diastolic} mmHg` : `${oor.data?.value} ${oor.data?.unit || ''}`;
      
      doc.text(timeStr, 50, currentY);
      doc.text(oor.data?.vitalType || 'vital', 180, currentY);
      doc.font('Helvetica-Bold').fillColor(cCorrectionRed).text(`[!] ${valStr}`, 300, currentY);
      doc.font('Helvetica').fillColor(cCorrectionRed).text(oor.data?.crossedEdge || 'Out of range', 410, currentY);
      currentY += 14;
    }
    if (outOfRangeVitals.length > 8) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(cWarmStone).text(`...and ${outOfRangeVitals.length - 8} more logged in digital archive`, 50, currentY);
      currentY += 14;
    }
  }

  // --- SECTION 2: MEDICINE ADHERENCE & MISSED DOSES ---
  currentY += 10;
  doc.fontSize(14).font('Helvetica-Bold').fillColor(cDeepAqua).text('2. Medication Adherence & Care History', 40, currentY);
  currentY += 18;

  const medEntries = entries.filter(e => e.kind === 'medicine' && !e.isDeleted);
  const given = medEntries.filter(m => m.data?.status === 'given').length;
  const missed = medEntries.filter(m => m.data?.status === 'missed');
  const adherenceRate = medEntries.length > 0 ? Math.round((given / medEntries.length) * 100) : 100;

  doc.fontSize(9).font('Helvetica').fillColor(cDarkStone);
  doc.text(`Overall 30-Day Medication Adherence: `, 40, currentY, { continued: true });
  doc.font('Helvetica-Bold').fillColor(adherenceRate >= 90 ? cDeepAqua : cCorrectionRed).text(`${adherenceRate}% (${given} given / ${medEntries.length} total scheduled doses)`);
  currentY += 16;

  if (missed.length > 0) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(cCorrectionRed).text(`Documented Missed Doses:`, 40, currentY);
    currentY += 14;
    for (const m of missed.slice(0, 5)) {
      const dt = new Date(m.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      doc.fontSize(8).font('Helvetica').fillColor(cDarkStone).text(`• ${dt} - ${m.data?.medicineName} (${m.data?.dose}): Missed due to "${m.data?.reason || 'unspecified'}"`, 50, currentY);
      currentY += 13;
    }
  }

  // --- SECTION 3: ACTIVITY, MEALS & MOOD SUMMARY ---
  currentY += 10;
  const meals = entries.filter(e => e.kind === 'meal' && !e.isDeleted);
  const activities = entries.filter(e => e.kind === 'activity' && !e.isDeleted);
  const totalActMins = activities.reduce((sum, a) => sum + (Number(a.data?.minutes) || 0), 0);
  const fullMealsCount = meals.filter(m => m.data?.portion === 'all' || m.data?.portion === 'most').length;

  doc.rect(40, currentY, 515, 42).fillAndStroke('#F1F3F2', cLightStone);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(cDarkStone).text('Nutrition & Physical Engagement Metrics:', 50, currentY + 8);
  doc.fontSize(9).font('Helvetica').fillColor(cDarkStone).text(`• Main meals completed: ${fullMealsCount} of ${meals.length} recorded meals`, 50, currentY + 22);
  doc.text(`• Total physical activity: ${totalActMins} minutes recorded (avg ${(totalActMins/30).toFixed(0)} min/day)`, 290, currentY + 22);
  currentY += 52;

  // --- SECTION 4: NURSE CLINICAL OBSERVATIONS ---
  if (currentY > 660) {
    doc.addPage();
    currentY = 40;
  }
  doc.fontSize(14).font('Helvetica-Bold').fillColor(cDeepAqua).text('3. Nurse Clinical Observations (Recent Excerpts)', 40, currentY);
  currentY += 18;

  const notes = entries.filter(e => (e.kind === 'observation' || e.kind === 'note') && !e.isDeleted);
  if (notes.length === 0) {
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(cWarmStone).text('No observation notes recorded.', 50, currentY);
  } else {
    for (const n of notes.slice(0, 5)) {
      if (currentY > 730) {
        doc.addPage();
        currentY = 40;
      }
      const dt = new Date(n.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      doc.rect(40, currentY, 4, 24).fill(cDeepAqua);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(cDarkStone).text(`${dt} (${n.authorName || 'Nurse Rekha'}):`, 50, currentY);
      doc.fontSize(8).font('Helvetica').fillColor(cDarkStone).text(`"${n.data?.text || n.data?.note || ''}"`, 50, currentY + 11, { width: 490 });
      currentY += 30;
    }
  }

  // --- PAGE NUMBERS & FOOTER ON ALL PAGES ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.moveTo(40, 785).lineTo(555, 785).strokeColor(cLightStone).lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica-Oblique').fillColor(cWarmStone).text(
      'Recorded by care staff. Not a diagnosis. Reference ranges are demo defaults.',
      40,
      792
    );
    doc.fontSize(8).font('Helvetica').fillColor(cDarkStone).text(
      `Page ${i + 1} of ${range.count}`,
      500,
      792,
      { align: 'right' }
    );
  }

  doc.end();
}
