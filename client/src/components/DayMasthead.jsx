import React from 'react';

/**
 * Masthead: Flat dark stone band (#3A342D) repeating the hero at working scale.
 * Day title in Libre Caslon Condensed (36px phone, 56-64px laptop),
 * and the generated two-sentence summary in Atkinson Hyperlegible 18px.
 */
export default function DayMasthead({ dateStr, summaryText, stats, patientName }) {
  // Format dateStr (e.g. 2026-11-17) into "Tuesday 17 November"
  const formatMastheadDate = (isoStr) => {
    if (!isoStr) return 'Today';
    const date = new Date(isoStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const hasOutRange = stats?.outOfRangeCount > 0;
  const hasMissed = stats?.missedDosesCount > 0;

  return (
    <section className="w-full bg-[#3A342D] text-[#F1F3F2] py-8 sm:py-10 px-4 sm:px-6 shadow-sm border-b border-[#D9D3CA]/20">
      <div className="max-w-4xl mx-auto">
        {/* Patient identifier tag */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs uppercase tracking-widest text-[#D3ECF0] font-sans font-semibold">
            {patientName || 'Kamla Sharma'} · Daily Care Log
          </span>
          <div className="flex items-center gap-2">
            {hasOutRange && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#B3261E] text-[#F1F3F2] px-2 py-0.5 rounded">
                [!] {stats.outOfRangeCount} out-of-range
              </span>
            )}
            {hasMissed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#B3261E] text-[#F1F3F2] px-2 py-0.5 rounded">
                [x] {stats.missedDosesCount} missed dose
              </span>
            )}
          </div>
        </div>

        {/* Day Title in Libre Caslon Condensed */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#F1F3F2] font-normal leading-[1.0] tracking-[-0.01em] mb-4">
          {formatMastheadDate(dateStr)}
        </h1>

        {/* Generated Two-Sentence Summary in Atkinson Hyperlegible (18px) */}
        <p className="font-sans text-base sm:text-lg text-[#F1F3F2]/90 max-w-3xl leading-relaxed">
          {summaryText || `${patientName?.split(' ')[0] || 'Kamla'} had routine care logged today.`}
        </p>
      </div>
    </section>
  );
}
