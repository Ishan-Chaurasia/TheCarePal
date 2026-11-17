import React from 'react';

/**
 * Short vital ruler showing where the reading sits relative to the normal range band.
 * Normal band is drawn in aqua tint (#D3ECF0).
 * In-range reading: aqua mark (#46B3C6).
 * Out-of-range reading: distinct red diamond (#B3261E) with explicit "high" or "low" label and boundary crossed.
 */
export default function VitalRuler({ vitalType, value, meta = {} }) {
  let min = 50;
  let max = 200;
  let bandStart = 70;
  let bandEnd = 130;
  let valNum = Number(value);

  if (vitalType === 'bloodPressure') {
    min = 60;
    max = 180;
    bandStart = 90;
    bandEnd = 139;
    valNum = Number(meta.systolic || value?.systolic || 120);
  } else if (vitalType === 'pulse') {
    min = 40;
    max = 140;
    bandStart = 60;
    bandEnd = 100;
  } else if (vitalType === 'spo2') {
    min = 85;
    max = 100;
    bandStart = 94;
    bandEnd = 100;
  } else if (vitalType === 'bloodSugar') {
    min = 50;
    max = 240;
    bandStart = 70;
    bandEnd = meta.timing === 'afterMeal' ? 180 : 130;
  } else if (vitalType === 'temperature') {
    min = 95.0;
    max = 103.0;
    bandStart = 97.0;
    bandEnd = 99.5;
  }

  // Calculate percentage along ruler
  const totalSpan = max - min;
  const bandLeftPct = Math.max(0, Math.min(100, ((bandStart - min) / totalSpan) * 100));
  const bandWidthPct = Math.max(10, Math.min(100, ((bandEnd - bandStart) / totalSpan) * 100));
  const valPosPct = Math.max(2, Math.min(98, ((valNum - min) / totalSpan) * 100));

  const isOutOfRange = meta.isOutOfRange;
  const isHigh = meta.status === 'high' || valNum > bandEnd;
  const isLow = meta.status === 'low' || valNum < bandStart;

  return (
    <div className="flex items-center gap-2" role="region" aria-label={`Normal range ruler for ${vitalType}`}>
      {/* 68px micro-ruler */}
      <div className="relative w-16 h-3 bg-[#D9D3CA] rounded-sm overflow-hidden shrink-0 border border-[#D9D3CA]">
        {/* Shaded normal range band (Aqua Tint #D3ECF0) */}
        <div
          className="absolute top-0 bottom-0 bg-[#D3ECF0]"
          style={{ left: `${bandLeftPct}%`, width: `${bandWidthPct}%` }}
          title={`Normal band: ${bandStart}–${bandEnd}`}
        />

        {/* Value marker */}
        {isOutOfRange ? (
          /* Red diamond marker for out of range */
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#B3261E] rotate-45 z-10 shadow-xs"
            style={{ left: `${valPosPct}%` }}
            title={`Out of range: ${valNum}`}
          />
        ) : (
          /* Aqua marker for in-range */
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#17707F] z-10"
            style={{ left: `${valPosPct}%` }}
            title={`In range: ${valNum}`}
          />
        )}
      </div>

      {/* Out of range text indicator with edge details */}
      {isOutOfRange && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B3261E] bg-[#FEE2E2] px-1.5 py-0.5 rounded-sm">
          <span>{isHigh ? '▲ high' : '▼ low'}</span>
          {meta.crossedEdge && <span className="font-normal text-[11px] opacity-85">({meta.crossedEdge})</span>}
        </span>
      )}
    </div>
  );
}
