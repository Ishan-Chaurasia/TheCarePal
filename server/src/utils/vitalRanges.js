export const DEFAULT_RANGES = {
  bloodPressure: {
    systolic: { min: 90, max: 139, unit: 'mmHg' },
    diastolic: { min: 60, max: 89, unit: 'mmHg' }
  },
  pulse: { min: 60, max: 100, unit: 'bpm' },
  spo2: { min: 94, max: 100, unit: '%' },
  bloodSugar: {
    fasting: { min: 70, max: 130, unit: 'mg/dL' },
    beforeMeal: { min: 70, max: 130, unit: 'mg/dL' },
    afterMeal: { min: 70, max: 180, unit: 'mg/dL' }
  },
  temperature: { min: 97.0, max: 99.5, unit: '°F' },
  weight: { unit: 'kg' }
};

export function checkVitalOutOfRange(vitalType, value, meta = {}) {
  const v = Number(value);
  if (isNaN(v) && vitalType !== 'bloodPressure') {
    return { isOutOfRange: false, status: 'normal' };
  }

  switch (vitalType) {
    case 'bloodPressure': {
      const sys = Number(meta.systolic || value?.systolic);
      const dia = Number(meta.diastolic || value?.diastolic);
      if (isNaN(sys) || isNaN(dia)) return { isOutOfRange: false, status: 'normal' };
      
      const sysHigh = sys > DEFAULT_RANGES.bloodPressure.systolic.max;
      const sysLow = sys < DEFAULT_RANGES.bloodPressure.systolic.min;
      const diaHigh = dia > DEFAULT_RANGES.bloodPressure.diastolic.max;
      const diaLow = dia < DEFAULT_RANGES.bloodPressure.diastolic.min;

      if (sysHigh || diaHigh) {
        return {
          isOutOfRange: true,
          status: 'high',
          label: 'High',
          band: '90–139 / 60–89 mmHg',
          crossedEdge: sysHigh ? `Systolic ${sys} > 139` : `Diastolic ${dia} > 89`
        };
      }
      if (sysLow || diaLow) {
        return {
          isOutOfRange: true,
          status: 'low',
          label: 'Low',
          band: '90–139 / 60–89 mmHg',
          crossedEdge: sysLow ? `Systolic ${sys} < 90` : `Diastolic ${dia} < 60`
        };
      }
      return { isOutOfRange: false, status: 'normal', label: 'Normal', band: '90–139 / 60–89 mmHg' };
    }

    case 'pulse': {
      if (v > DEFAULT_RANGES.pulse.max) {
        return { isOutOfRange: true, status: 'high', label: 'High', band: '60–100 bpm', crossedEdge: `${v} > 100` };
      }
      if (v < DEFAULT_RANGES.pulse.min) {
        return { isOutOfRange: true, status: 'low', label: 'Low', band: '60–100 bpm', crossedEdge: `${v} < 60` };
      }
      return { isOutOfRange: false, status: 'normal', label: 'Normal', band: '60–100 bpm' };
    }

    case 'spo2': {
      if (v < DEFAULT_RANGES.spo2.min) {
        return { isOutOfRange: true, status: 'low', label: 'Low', band: '94–100 %', crossedEdge: `${v} < 94` };
      }
      return { isOutOfRange: false, status: 'normal', label: 'Normal', band: '94–100 %' };
    }

    case 'bloodSugar': {
      const timing = meta.timing || 'fasting';
      const range = (timing === 'afterMeal')
        ? DEFAULT_RANGES.bloodSugar.afterMeal
        : DEFAULT_RANGES.bloodSugar.fasting;

      if (v > range.max) {
        return { isOutOfRange: true, status: 'high', label: 'High', band: `70–${range.max} mg/dL`, crossedEdge: `${v} > ${range.max}` };
      }
      if (v < range.min) {
        return { isOutOfRange: true, status: 'low', label: 'Low', band: `70–${range.max} mg/dL`, crossedEdge: `${v} < ${range.min}` };
      }
      return { isOutOfRange: false, status: 'normal', label: 'Normal', band: `70–${range.max} mg/dL` };
    }

    case 'temperature': {
      if (v > DEFAULT_RANGES.temperature.max) {
        return { isOutOfRange: true, status: 'high', label: 'High', band: '97.0–99.5 °F', crossedEdge: `${v} > 99.5` };
      }
      if (v < DEFAULT_RANGES.temperature.min) {
        return { isOutOfRange: true, status: 'low', label: 'Low', band: '97.0–99.5 °F', crossedEdge: `${v} < 97.0` };
      }
      return { isOutOfRange: false, status: 'normal', label: 'Normal', band: '97.0–99.5 °F' };
    }

    case 'weight':
    default:
      return { isOutOfRange: false, status: 'normal', label: 'Recorded' };
  }
}
