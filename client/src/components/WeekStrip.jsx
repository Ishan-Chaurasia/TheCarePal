import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

export default function WeekStrip({ selectedDate, onSelectDate, calendarMap = {} }) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Derive Monday of the current selected date's week
  const curr = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = curr.getDay(); // 0 is Sunday
  const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diffToMonday));

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().substring(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    weekDays.push({ iso, dayName, dayNum });
  }

  const shiftWeek = (deltaDays) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    onSelectDate(d.toISOString().substring(0, 10));
  };

  return (
    <div className="w-full bg-[#F1F3F2] border-b border-[#D9D3CA] py-3 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Previous Week */}
        <button
          type="button"
          onClick={() => shiftWeek(-7)}
          aria-label="Previous week"
          className="p-1.5 rounded text-[#3A342D] hover:bg-[#D9D3CA]/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#3A342D]" />
        </button>

        {/* 7 Days of the Week */}
        <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((item) => {
            const isSelected = item.iso === selectedDate;
            const dayMeta = calendarMap[item.iso];
            const hasLog = !!dayMeta?.hasLog;
            const hasFlag = dayMeta?.hasOutOfRange || dayMeta?.hasMissedDose;

            return (
              <button
                key={item.iso}
                type="button"
                onClick={() => onSelectDate(item.iso)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all relative ${
                  isSelected
                    ? 'bg-[#17707F] text-[#F1F3F2] shadow-sm font-bold'
                    : hasLog
                    ? 'bg-white text-[#3A342D] border border-[#D9D3CA] hover:border-[#17707F]'
                    : 'bg-[#F1F3F2] text-[#7A7268] border border-dashed border-[#D9D3CA]'
                }`}
              >
                <span className="text-[11px] font-sans uppercase tracking-tight">
                  {item.dayName}
                </span>
                <span className="text-sm sm:text-base font-semibold tabular-nums mt-0.5">
                  {item.dayNum}
                </span>

                {/* Flag indicator: Red tick/dot for out-of-range or missed dose */}
                {hasFlag && (
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                      isSelected ? 'bg-[#F1F3F2] ring-2 ring-[#B3261E]' : 'bg-[#B3261E]'
                    }`}
                    title="Out of range vital or missed dose logged"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Next Week */}
        <button
          type="button"
          onClick={() => shiftWeek(7)}
          aria-label="Next week"
          className="p-1.5 rounded text-[#3A342D] hover:bg-[#D9D3CA]/60 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#3A342D]" />
        </button>

        {/* Jump to Month Calendar Button */}
        <button
          type="button"
          onClick={() => setShowCalendarModal(true)}
          className="ml-2 flex items-center gap-1 text-xs font-semibold text-[#17707F] border border-[#17707F]/40 hover:bg-[#D3ECF0]/60 px-2.5 py-1.5 rounded-md transition-colors"
          title="Jump to date calendar"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Jump</span>
        </button>
      </div>

      {/* Month Calendar Picker Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-[#3A342D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F1F3F2] rounded-xl border border-[#D9D3CA] p-6 max-w-md w-full shadow-2xl text-[#3A342D]">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D3CA]">
              <h3 className="font-serif text-lg font-bold text-[#3A342D]">
                Select Care History Date
              </h3>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="text-sm font-semibold text-[#7A7268] hover:text-[#3A342D]"
              >
                ✕ Close
              </button>
            </div>

            <div className="py-4">
              <p className="text-xs text-[#7A7268] mb-3">
                Showing 45 days of seeded synthetic clinical history (Oct 4 – Nov 17, 2026).
              </p>
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {Object.keys(calendarMap)
                  .sort((a, b) => b.localeCompare(a))
                  .map((dateKey) => {
                    const info = calendarMap[dateKey];
                    const d = new Date(dateKey + 'T00:00:00');
                    const label = d.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const isCur = dateKey === selectedDate;
                    const hasOOR = info.hasOutOfRange || info.hasMissedDose;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => {
                          onSelectDate(dateKey);
                          setShowCalendarModal(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isCur
                            ? 'bg-[#17707F] text-white font-bold'
                            : 'bg-white hover:bg-[#D3ECF0]/40 text-[#3A342D] border border-[#D9D3CA]'
                        }`}
                      >
                        <span className="font-medium">{label}</span>
                        <div className="flex items-center gap-1.5">
                          {hasOOR && (
                            <span className="text-[10px] font-bold text-[#B3261E] bg-[#FEE2E2] px-1.5 py-0.5 rounded">
                              [!] Alert
                            </span>
                          )}
                          <span className="text-[11px] opacity-75 tabular-nums">
                            {info.entryCount} entries
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
