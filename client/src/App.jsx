import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import HeroSignIn from './components/HeroSignIn.jsx';
import TopBar from './components/TopBar.jsx';
import DayMasthead from './components/DayMasthead.jsx';
import WeekStrip from './components/WeekStrip.jsx';
import Timeline from './components/Timeline.jsx';
import VitalCharts from './components/VitalCharts.jsx';
import WeeklySummary from './components/WeeklySummary.jsx';
import NurseForm from './components/NurseForm.jsx';
import ReportModal from './components/ReportModal.jsx';
import PhotoModal from './components/PhotoModal.jsx';
import AuditTrailModal from './components/AuditTrailModal.jsx';
import EditEntryModal from './components/EditEntryModal.jsx';
import OfflineBadge from './components/OfflineBadge.jsx';
import { apiRequest } from './api.js';

export default function App() {
  const { user, patient, loading, isNurse } = useAuth();

  // Active view: 'today' | 'charts' | 'weekly' | 'nurse-log'
  const [activeTab, setActiveTab] = useState('today');

  // Active selected date (defaults to today 2026-11-17 per seed / PRD anchor)
  const [selectedDate, setSelectedDate] = useState('2026-11-17');

  // Day data
  const [dayData, setDayData] = useState(null);
  const [calendarMap, setCalendarMap] = useState({});
  const [loadingDay, setLoadingDay] = useState(false);

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);
  const [auditEntryId, setAuditEntryId] = useState(null);
  const [editEntryItem, setEditEntryItem] = useState(null);

  // Load calendar index
  const loadCalendar = async () => {
    if (!patient?._id) return;
    try {
      const res = await apiRequest(`/patients/${patient._id}/calendar?month=${selectedDate.substring(0, 7)}`);
      setCalendarMap(res.days || {});
    } catch (e) {
      console.error('Failed to load calendar:', e);
    }
  };

  // Load day timeline
  const loadDayData = async () => {
    if (!patient?._id) return;
    setLoadingDay(true);
    try {
      const res = await apiRequest(`/patients/${patient._id}/day/${selectedDate}`);
      setDayData(res);
    } catch (e) {
      console.error('Failed to load day data:', e);
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    if (patient?._id) {
      loadCalendar();
      loadDayData();
    }
  }, [patient?._id, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F3F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D9D3CA] border-t-[#17707F] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated -> show Hero Sign In
  if (!user) {
    return <HeroSignIn />;
  }

  const isSameDay = selectedDate === '2026-11-17' || selectedDate === new Date().toISOString().substring(0, 10);

  const handleDeleteEntry = async (entry) => {
    if (!confirm('Are you sure you want to remove this entry? An audit record will be logged.')) return;
    try {
      await apiRequest(`/patients/${patient._id}/entries/${entry._id}`, {
        method: 'DELETE'
      });
      loadDayData();
      loadCalendar();
    } catch (err) {
      alert(err.message || 'Failed to delete entry.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] text-[#3A342D] flex flex-col font-sans">
      {/* Top Bar with Product Views and User indicator */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setShowReportModal(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1">
        {activeTab === 'today' && (
          <>
            {/* Masthead in dark stone band */}
            <DayMasthead
              dateStr={selectedDate}
              summaryText={dayData?.summary}
              stats={dayData?.stats}
              patientName={patient?.name}
            />

            {/* Always visible week strip */}
            <WeekStrip
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              calendarMap={calendarMap}
            />

            {/* Day Sheet Timeline */}
            <Timeline
              dayData={dayData}
              loading={loadingDay}
              isNurse={isNurse}
              isSameDay={isSameDay}
              onEditEntry={(entry) => setEditEntryItem(entry)}
              onDeleteEntry={handleDeleteEntry}
              onViewAudit={(id) => setAuditEntryId(id)}
              onOpenReportModal={() => setShowReportModal(true)}
              onOpenPhoto={(url) => setActivePhotoUrl(url)}
            />
          </>
        )}

        {activeTab === 'charts' && (
          <VitalCharts patient={patient} />
        )}

        {activeTab === 'weekly' && (
          <WeeklySummary
            patient={patient}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'nurse-log' && isNurse && (
          <NurseForm
            patient={patient}
            selectedDate={selectedDate}
            onEntrySaved={() => {
              loadDayData();
              loadCalendar();
            }}
          />
        )}
      </main>

      {/* Modals */}
      {showReportModal && (
        <ReportModal
          patient={patient}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {activePhotoUrl && (
        <PhotoModal
          photoUrl={activePhotoUrl}
          onClose={() => setActivePhotoUrl(null)}
        />
      )}

      {auditEntryId && (
        <AuditTrailModal
          patientId={patient._id}
          entryId={auditEntryId}
          onClose={() => setAuditEntryId(null)}
        />
      )}

      {editEntryItem && (
        <EditEntryModal
          patientId={patient._id}
          entry={editEntryItem}
          onClose={() => setEditEntryItem(null)}
          onUpdated={() => {
            loadDayData();
            loadCalendar();
          }}
        />
      )}

      {/* Offline Sync Floating Badge */}
      <OfflineBadge onSynced={() => { loadDayData(); loadCalendar(); }} />
    </div>
  );
}
