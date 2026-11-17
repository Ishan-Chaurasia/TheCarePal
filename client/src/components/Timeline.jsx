import React, { useState } from 'react';
import TimelineEntry from './TimelineEntry.jsx';
import { Download, AlertTriangle, Droplet, Clock, Heart } from 'lucide-react';

export default function Timeline({
  dayData,
  loading,
  isNurse,
  isSameDay,
  onEditEntry,
  onDeleteEntry,
  onViewAudit,
  onOpenReportModal,
  onOpenPhoto
}) {
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#D9D3CA] border-t-[#17707F] rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-[#7A7268]">Loading care records…</p>
      </div>
    );
  }

  const entries = dayData?.entries || [];

  if (entries.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#D9D3CA]/50 text-[#7A7268] flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#3A342D] mb-1">
          Nothing logged for this day yet
        </h3>
        <p className="text-sm text-[#7A7268] mb-6">
          Caregiver logs appear here automatically as rounds are conducted.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Day Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#D9D3CA]">
        <div className="flex items-center gap-4 text-xs font-medium text-[#7A7268]">
          <span className="flex items-center gap-1.5 text-[#3A342D] font-bold">
            <Clock className="w-4 h-4 text-[#17707F]" />
            <span>{entries.length} care events recorded</span>
          </span>
          {dayData?.stats?.runningWaterMl > 0 && (
            <span className="flex items-center gap-1 text-[#17707F]">
              <Droplet className="w-3.5 h-3.5" />
              <span>{dayData.stats.runningWaterMl} ml water total</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#17707F] text-[#F1F3F2] hover:bg-[#135d6a] px-3 py-1.5 rounded-md transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download 30-day report</span>
        </button>
      </div>

      {/* Main Day Sheet Timeline */}
      <div className="relative pl-1 sm:pl-2">
        {entries.map((entry) => (
          <TimelineEntry
            key={entry._id || entry.clientId}
            entry={entry}
            isNurse={isNurse}
            isSameDay={isSameDay}
            onEdit={onEditEntry}
            onDelete={onDeleteEntry}
            onViewAudit={onViewAudit}
            onOpenPhoto={onOpenPhoto}
          />
        ))}
      </div>
    </div>
  );
}
