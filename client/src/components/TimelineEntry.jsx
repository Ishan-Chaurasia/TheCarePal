import React from 'react';
import PlateGlyph from './PlateGlyph.jsx';
import VitalRuler from './VitalRuler.jsx';
import { Pill, Activity as ActivityIcon, Edit3, Trash2, Eye, Image as ImageIcon } from 'lucide-react';

export default function TimelineEntry({
  entry,
  isNurse,
  isSameDay,
  onEdit,
  onDelete,
  onViewAudit,
  onOpenPhoto
}) {
  const { kind, time, data = {}, authorName, photos = [] } = entry;

  return (
    <div className="group relative flex items-start gap-4 sm:gap-6 py-3 transition-colors">
      {/* Time column on the left */}
      <div className="w-12 sm:w-16 shrink-0 text-right">
        <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-[#3A342D]/80">
          {time || entry.at?.substring(11, 16) || '—'}
        </span>
      </div>

      {/* Vertical Rail Dot & Connector */}
      <div className="relative flex flex-col items-center">
        {/* Rail dot */}
        <div
          className={`w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 transition-transform ${
            data?.isOutOfRange || data?.status === 'missed'
              ? 'bg-[#B3261E] ring-4 ring-[#B3261E]/20'
              : 'bg-[#17707F]'
          }`}
        />
        {/* Continuous vertical rail line */}
        <div className="w-px h-full bg-[#D9D3CA] absolute top-4 bottom-0 -z-0" />
      </div>

      {/* Entry Content Body */}
      <div className="flex-1 pb-4 border-b border-[#D9D3CA]/40">
        {/* --- 1. VITAL ENTRY --- */}
        {kind === 'vital' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="font-bold text-sm text-[#3A342D]">
                {data.vitalType === 'bloodPressure'
                  ? 'Blood pressure'
                  : data.vitalType === 'bloodSugar'
                  ? `Blood sugar (${data.timing || 'fasting'})`
                  : data.vitalType === 'pulse'
                  ? 'Pulse rate'
                  : data.vitalType === 'spo2'
                  ? 'Oxygen (SpO2)'
                  : data.vitalType === 'temperature'
                  ? 'Temperature'
                  : data.vitalType}
              </span>

              {/* Value with units */}
              <span className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
                data.isOutOfRange ? 'text-[#B3261E]' : 'text-[#3A342D]'
              }`}>
                {data.vitalType === 'bloodPressure'
                  ? `${data.systolic}/${data.diastolic} mmHg`
                  : `${data.value} ${data.unit || ''}`}
              </span>

              {/* Micro-ruler with aqua tint band & status */}
              <VitalRuler
                vitalType={data.vitalType}
                value={data.value}
                meta={data}
              />
            </div>

            {/* Same-day nurse actions */}
            {isNurse && isSameDay && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="p-1 text-[#7A7268] hover:text-[#17707F] rounded"
                  title="Edit reading"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  className="p-1 text-[#7A7268] hover:text-[#B3261E] rounded"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 2. MEAL ENTRY --- */}
        {kind === 'meal' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <PlateGlyph portion={data.portion} className="w-5 h-5 text-[#3A342D]" />
              <div className="text-sm text-[#3A342D]">
                <span className="font-bold capitalize">{data.mealType || 'Meal'}:</span>{' '}
                <span className="font-medium">{data.items || 'Standard diet'}</span>{' '}
                <span className="text-xs text-[#7A7268] font-normal">
                  ({data.portion ? `ate ${data.portion}` : 'complete'})
                </span>
              </div>
            </div>

            {/* Running water counter */}
            {data.waterMl > 0 && (
              <div className="text-xs text-[#17707F] pl-8">
                + {data.waterMl} ml water intake
                {data.runningWaterTotal && (
                  <span className="text-[#7A7268] ml-2">
                    (Total today: {data.runningWaterTotal} ml)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 3. MEDICINE ENTRY --- */}
        {kind === 'medicine' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {data.status === 'given' ? (
                /* Filled dot for given with the time */
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17707F] bg-[#D3ECF0] px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-[#17707F]" />
                  <span>Given {data.givenAt || time}</span>
                </span>
              ) : (
                /* Hollow ring with a strike and reason in red for missed */
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B3261E] bg-[#FEE2E2] px-2 py-0.5 rounded">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#B3261E] relative">
                    <span className="absolute inset-0 m-auto w-3 h-0.5 bg-[#B3261E] -rotate-45" />
                  </span>
                  <span>Missed: {data.reason || 'refused'}</span>
                </span>
              )}

              <span className="font-bold text-sm text-[#3A342D]">
                {data.medicineName} {data.dose}
              </span>
              <span className="text-xs text-[#7A7268]">
                (Scheduled: {data.scheduledTime})
              </span>
            </div>

            {isNurse && isSameDay && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="p-1 text-[#7A7268] hover:text-[#17707F]"
                  title="Edit medicine record"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 4. ACTIVITY ENTRY --- */}
        {kind === 'activity' && (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#3A342D]">
                {data.activityType || 'Activity'}
              </span>
              <span className="text-xs font-bold text-[#17707F]">
                {data.minutes} minutes
              </span>
            </div>

            {/* Aqua blue bar scaled in minutes */}
            <div className="w-full max-w-xs h-2 bg-[#D9D3CA]/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#46B3C6] rounded-full transition-all"
                style={{ width: `${Math.min(100, (Number(data.minutes || 10) / 45) * 100)}%` }}
              />
            </div>

            {data.notes && (
              <p className="text-xs text-[#7A7268] italic mt-0.5">
                {data.notes}
              </p>
            )}
          </div>
        )}

        {/* --- 5. MOOD ENTRY --- */}
        {kind === 'mood' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7268]">
              Mood:
            </span>
            <span className="font-semibold text-sm capitalize text-[#3A342D] bg-white border border-[#D9D3CA] px-2.5 py-0.5 rounded-full">
              {data.scale || 'Steady'}
            </span>
            {data.context && (
              <span className="text-xs text-[#7A7268] italic">
                — {data.context}
              </span>
            )}
          </div>
        )}

        {/* --- 6. NURSE OBSERVATION NOTE --- */}
        {(kind === 'observation' || kind === 'note') && (
          <div className="border-l-2 border-[#17707F] pl-3 py-1 my-1">
            <div className="text-xs font-bold text-[#17707F] mb-1">
              {authorName || 'Nurse Rekha'} observed:
            </div>
            <p className="font-sans text-[17px] text-[#3A342D] leading-relaxed">
              "{data.text || data.note || ''}"
            </p>
          </div>
        )}

        {/* Photos (if attached) */}
        {photos && photos.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-1">
            {photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenPhoto(url)}
                className="relative group/photo rounded-md overflow-hidden border border-[#D9D3CA] hover:ring-2 hover:ring-[#17707F] focus:outline-none"
              >
                <img
                  src={url}
                  alt={`Care photo ${idx + 1}`}
                  className="w-14 h-14 object-cover"
                />
                <span className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white text-[10px]">
                  Enlarge
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Audit Trail Button if entry has edits */}
        {entry.editedAt && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#7A7268]">
            <span>Edited {entry.editedAt.substring(11, 16)}</span>
            <button
              type="button"
              onClick={() => onViewAudit(entry._id)}
              className="text-[#17707F] hover:underline"
            >
              (view audit trail)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
