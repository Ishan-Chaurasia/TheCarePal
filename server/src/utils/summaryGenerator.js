/**
 * Fixed rule-based deterministic summary generator for Daily Care History (FS-03)
 * Strictly non-AI, predictable, and verifiable.
 */

export function generateDaySummary(patientName, dayEntries, scheduledDoses = []) {
  const firstName = patientName.split(' ')[0] || 'The patient';

  if (!dayEntries || dayEntries.length === 0) {
    return `${firstName} had no care entries recorded for this day yet.`;
  }

  // 1. Medicines
  const medEntries = dayEntries.filter(e => e.kind === 'medicine' && !e.isDeleted);
  const givenMeds = medEntries.filter(e => e.data?.status === 'given');
  const missedMeds = medEntries.filter(e => e.data?.status === 'missed');
  
  const totalScheduled = scheduledDoses.length > 0 ? scheduledDoses.length : (givenMeds.length + missedMeds.length);
  let medSentence = '';
  if (totalScheduled === 0) {
    medSentence = `No scheduled medications were due today.`;
  } else if (givenMeds.length === totalScheduled) {
    medSentence = `${firstName} took all ${totalScheduled} scheduled doses.`;
  } else {
    medSentence = `${firstName} had ${givenMeds.length} of ${totalScheduled} doses.`;
  }

  // 2. Meals
  const mealEntries = dayEntries.filter(e => e.kind === 'meal' && !e.isDeleted);
  let mealPhrase = '';
  const fullMeals = mealEntries.filter(m => m.data?.portion === 'all' || m.data?.portion === 'most');
  if (mealEntries.length > 0) {
    if (fullMeals.length === mealEntries.length && fullMeals.length >= 2) {
      mealPhrase = `ate meals fully`;
    } else if (fullMeals.length > 0) {
      const mealTypes = fullMeals.map(m => m.data?.mealType || 'meals').join(' and ');
      mealPhrase = `ate ${mealTypes} fully`;
    } else {
      mealPhrase = `had lighter meals`;
    }
  }

  // 3. Activity
  const activityEntries = dayEntries.filter(e => e.kind === 'activity' && !e.isDeleted);
  let activityPhrase = '';
  const totalMinutes = activityEntries.reduce((sum, a) => sum + (Number(a.data?.minutes) || 0), 0);
  if (totalMinutes > 0) {
    const actType = activityEntries[0]?.data?.activityType || 'walked';
    if (actType.toLowerCase().includes('walk')) {
      activityPhrase = `walked ${totalMinutes} minutes`;
    } else if (actType.toLowerCase().includes('physio')) {
      activityPhrase = `did ${totalMinutes} mins of physiotherapy`;
    } else {
      activityPhrase = `completed ${totalMinutes} mins of ${actType.toLowerCase()}`;
    }
  }

  // 4. Vitals flags
  const vitalEntries = dayEntries.filter(e => e.kind === 'vital' && !e.isDeleted);
  const outOfRangeVitals = vitalEntries.filter(v => v.data?.isOutOfRange);
  let vitalPhrase = '';
  if (outOfRangeVitals.length === 0 && vitalEntries.length > 0) {
    vitalPhrase = `all vitals stayed in normal range`;
  } else if (outOfRangeVitals.length === 1) {
    const vName = outOfRangeVitals[0].data?.vitalType || 'reading';
    vitalPhrase = `had one high reading (${vName})`;
  } else if (outOfRangeVitals.length > 1) {
    vitalPhrase = `had ${outOfRangeVitals.length} readings out of range`;
  }

  // Assemble second sentence
  const secondParts = [];
  if (mealPhrase) secondParts.push(mealPhrase);
  if (activityPhrase) secondParts.push(activityPhrase);
  if (vitalPhrase) secondParts.push(vitalPhrase);

  let secondSentence = '';
  if (secondParts.length > 0) {
    // e.g. "She ate breakfast and lunch fully, walked 25 minutes and had one high reading."
    if (secondParts.length === 1) {
      secondSentence = `She ${secondParts[0]}.`;
    } else if (secondParts.length === 2) {
      secondSentence = `She ${secondParts[0]} and ${secondParts[1]}.`;
    } else {
      secondSentence = `She ${secondParts[0]}, ${secondParts[1]} and ${secondParts[2]}.`;
    }
  } else {
    secondSentence = `Routine day observed with no major incidents.`;
  }

  return `${medSentence} ${secondSentence}`;
}
