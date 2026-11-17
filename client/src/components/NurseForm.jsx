import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';
import {
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Utensils,
  Pill,
  Smile,
  FileText,
  Upload,
  Camera,
  Check,
  X,
  Radio,
  Mail,
  ExternalLink
} from 'lucide-react';
import PlateGlyph from './PlateGlyph.jsx';
import EmailPreviewModal from './EmailPreviewModal.jsx';

export default function NurseForm({ patient, selectedDate, onEntrySaved }) {
  const getNowTime = () => {
    const d = new Date();
    return d.toTimeString().substring(0, 5);
  };

  const [logTime, setLogTime] = useState(getNowTime());
  const [scheduledItems, setScheduledItems] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Email Alert Banners & Modals (PRD F7)
  const [activeAlertBanner, setActiveAlertBanner] = useState(null);
  const [previewAlert, setPreviewAlert] = useState(null);

  // Section Save Statuses (N9)
  const [statusVitals, setStatusVitals] = useState({ state: 'idle', msg: '', isOffline: false });
  const [statusMeal, setStatusMeal] = useState({ state: 'idle', msg: '', isOffline: false });
  const [statusActivity, setStatusActivity] = useState({ state: 'idle', msg: '', isOffline: false });
  const [statusMood, setStatusMood] = useState({ state: 'idle', msg: '', isOffline: false });
  const [statusNote, setStatusNote] = useState({ state: 'idle', msg: '', isOffline: false });

  // 1. Vitals state
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [sugar, setSugar] = useState('');
  const [sugarTiming, setSugarTiming] = useState('fasting');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');

  // 2. Meal state
  const [mealType, setMealType] = useState('breakfast');
  const [mealItems, setMealItems] = useState('');
  const [portion, setPortion] = useState('all');
  const [waterMl, setWaterMl] = useState(250);

  // 3. Activity state
  const [activityType, setActivityType] = useState('Walk');
  const [activityMinutes, setActivityMinutes] = useState(20);
  const [activityNotes, setActivityNotes] = useState('');

  // 4. Mood state
  const [moodScale, setMoodScale] = useState('good');
  const [moodContext, setMoodContext] = useState('');

  // 5. Notes & Photos
  const [observationText, setObservationText] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load schedule for this day
  useEffect(() => {
    async function loadSchedule() {
      if (!patient?._id) return;
      setLoadingSchedule(true);
      try {
        const res = await apiRequest(`/patients/${patient._id}/schedule/${selectedDate}`);
        setScheduledItems(res.items || []);
      } catch (e) {
        console.error('Failed to load schedule:', e);
      } finally {
        setLoadingSchedule(false);
      }
    }
    loadSchedule();
  }, [patient?._id, selectedDate]);

  // Real-time out-of-range checking (N1)
  const bpOutOfRange = (bpSys && (Number(bpSys) > 139 || Number(bpSys) < 90)) ||
                       (bpDia && (Number(bpDia) > 89 || Number(bpDia) < 60));
  const pulseOutOfRange = pulse && (Number(pulse) > 100 || Number(pulse) < 60);
  const spo2OutOfRange = spo2 && Number(spo2) < 94;
  const sugarOutOfRange = sugar && (
    sugarTiming === 'afterMeal' ? Number(sugar) > 180 : (Number(sugar) > 130 || Number(sugar) < 70)
  );
  const tempOutOfRange = temp && (Number(temp) > 99.5 || Number(temp) < 97.0);

  // Save Vitals independently
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    setStatusVitals({ state: 'saving', msg: 'Saving vitals…', isOffline: false });
    let wasOffline = false;
    let dispatchedAlert = null;

    try {
      if (bpSys && bpDia) {
        const r = await apiRequest(`/patients/${patient._id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'vital',
            day: selectedDate,
            time: logTime,
            data: {
              vitalType: 'bloodPressure',
              systolic: Number(bpSys),
              diastolic: Number(bpDia),
              unit: 'mmHg'
            }
          })
        });
        if (r?.offline) wasOffline = true;
        if (r?.alertDispatched && r?.alert) dispatchedAlert = r.alert;
      }
      if (pulse) {
        const r = await apiRequest(`/patients/${patient._id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'vital',
            day: selectedDate,
            time: logTime,
            data: { vitalType: 'pulse', value: Number(pulse), unit: 'bpm' }
          })
        });
        if (r?.offline) wasOffline = true;
        if (r?.alertDispatched && r?.alert) dispatchedAlert = r.alert;
      }
      if (spo2) {
        const r = await apiRequest(`/patients/${patient._id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'vital',
            day: selectedDate,
            time: logTime,
            data: { vitalType: 'spo2', value: Number(spo2), unit: '%' }
          })
        });
        if (r?.offline) wasOffline = true;
        if (r?.alertDispatched && r?.alert) dispatchedAlert = r.alert;
      }
      if (sugar) {
        const r = await apiRequest(`/patients/${patient._id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'vital',
            day: selectedDate,
            time: logTime,
            data: { vitalType: 'bloodSugar', value: Number(sugar), unit: 'mg/dL', timing: sugarTiming }
          })
        });
        if (r?.offline) wasOffline = true;
        if (r?.alertDispatched && r?.alert) dispatchedAlert = r.alert;
      }
      if (temp) {
        const r = await apiRequest(`/patients/${patient._id}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'vital',
            day: selectedDate,
            time: logTime,
            data: { vitalType: 'temperature', value: Number(temp), unit: '°F' }
          })
        });
        if (r?.offline) wasOffline = true;
        if (r?.alertDispatched && r?.alert) dispatchedAlert = r.alert;
      }

      if (dispatchedAlert) {
        setActiveAlertBanner(dispatchedAlert);
      }

      setStatusVitals({
        state: 'saved',
        msg: wasOffline ? 'Saved to offline queue (will sync when online)' : 'Vitals saved successfully',
        isOffline: wasOffline
      });
      onEntrySaved();
      setBpSys('');
      setBpDia('');
      setPulse('');
      setSpo2('');
      setSugar('');
      setTemp('');
      setTimeout(() => setStatusVitals({ state: 'idle', msg: '', isOffline: false }), 4000);
    } catch (err) {
      setStatusVitals({ state: 'error', msg: "Couldn't save vitals. What you typed is still here. Try again.", isOffline: false });
    }
  };

  // Save Meal independently
  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!mealItems.trim()) return;
    setStatusMeal({ state: 'saving', msg: 'Saving meal…', isOffline: false });
    try {
      const res = await apiRequest(`/patients/${patient._id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'meal',
          day: selectedDate,
          time: logTime,
          data: {
            mealType,
            items: mealItems,
            portion,
            waterMl: Number(waterMl) || 0
          },
          photos: attachedPhotos
        })
      });
      const wasOffline = !!res?.offline;
      setStatusMeal({
        state: 'saved',
        msg: wasOffline ? 'Saved to offline queue (will sync when online)' : 'Meal entry saved',
        isOffline: wasOffline
      });
      setMealItems('');
      setAttachedPhotos([]);
      onEntrySaved();
      setTimeout(() => setStatusMeal({ state: 'idle', msg: '', isOffline: false }), 4000);
    } catch (err) {
      setStatusMeal({ state: 'error', msg: "Couldn't save meal. What you typed is kept.", isOffline: false });
    }
  };

  // Mark Medicine Dose (Given or Missed)
  const handleMarkMedicine = async (item, status, reason = '') => {
    try {
      const res = await apiRequest(`/patients/${patient._id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'medicine',
          day: selectedDate,
          time: logTime,
          data: {
            scheduleId: item.scheduleId,
            medicineName: item.name,
            dose: item.dose,
            scheduledTime: item.scheduledTime,
            status,
            givenAt: status === 'given' ? logTime : undefined,
            reason: status === 'missed' ? (reason || 'refused') : undefined
          }
        })
      });

      if (res?.alertDispatched && res?.alert) {
        setActiveAlertBanner(res.alert);
      }

      setScheduledItems(prev => prev.map(s => {
        if (s.scheduleId === item.scheduleId && s.scheduledTime === item.scheduledTime) {
          return {
            ...s,
            loggedEntry: { status, givenAt: logTime, reason }
          };
        }
        return s;
      }));
      onEntrySaved();
    } catch (err) {
      alert("Couldn't save medicine update. Please try again.");
    }
  };

  // Save Activity independently
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setStatusActivity({ state: 'saving', msg: 'Saving activity…', isOffline: false });
    try {
      const res = await apiRequest(`/patients/${patient._id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'activity',
          day: selectedDate,
          time: logTime,
          data: {
            activityType,
            minutes: Number(activityMinutes),
            notes: activityNotes
          }
        })
      });
      const wasOffline = !!res?.offline;
      setStatusActivity({
        state: 'saved',
        msg: wasOffline ? 'Saved to offline queue' : 'Activity saved',
        isOffline: wasOffline
      });
      setActivityNotes('');
      onEntrySaved();
      setTimeout(() => setStatusActivity({ state: 'idle', msg: '', isOffline: false }), 4000);
    } catch (err) {
      setStatusActivity({ state: 'error', msg: "Couldn't save activity.", isOffline: false });
    }
  };

  // Save Mood independently
  const handleSaveMood = async (e) => {
    e.preventDefault();
    setStatusMood({ state: 'saving', msg: 'Recording mood…', isOffline: false });
    try {
      const res = await apiRequest(`/patients/${patient._id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'mood',
          day: selectedDate,
          time: logTime,
          data: {
            scale: moodScale,
            context: moodContext
          }
        })
      });
      const wasOffline = !!res?.offline;
      setStatusMood({
        state: 'saved',
        msg: wasOffline ? 'Saved to offline queue' : 'Mood recorded',
        isOffline: wasOffline
      });
      setMoodContext('');
      onEntrySaved();
      setTimeout(() => setStatusMood({ state: 'idle', msg: '', isOffline: false }), 4000);
    } catch (err) {
      setStatusMood({ state: 'error', msg: "Couldn't record mood.", isOffline: false });
    }
  };

  // Save Observation Note independently
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!observationText.trim()) return;
    setStatusNote({ state: 'saving', msg: 'Saving note…', isOffline: false });
    try {
      const res = await apiRequest(`/patients/${patient._id}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'observation',
          day: selectedDate,
          time: logTime,
          data: { text: observationText },
          photos: attachedPhotos
        })
      });
      const wasOffline = !!res?.offline;
      setStatusNote({
        state: 'saved',
        msg: wasOffline ? 'Saved to offline queue' : 'Observation note saved',
        isOffline: wasOffline
      });
      setObservationText('');
      setAttachedPhotos([]);
      onEntrySaved();
      setTimeout(() => setStatusNote({ state: 'idle', msg: '', isOffline: false }), 4000);
    } catch (err) {
      setStatusNote({ state: 'error', msg: "Couldn't save note. Text is preserved.", isOffline: false });
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setAttachedPhotos(prev => [...prev.slice(0, 2), data.url]);
      }
    } catch (err) {
      alert('Photo upload failed. Try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 text-[#3A342D]">
      {/* Sticky Time Bar (N7: Time defaults to now, tap to adjust earlier today) */}
      <div className="sticky top-14 z-30 bg-[#F1F3F2] border-b border-[#D9D3CA] py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 flex items-center justify-between shadow-xs mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#17707F]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#3A342D]">
            Logging time for:
          </span>
          <input
            type="time"
            value={logTime}
            onChange={(e) => setLogTime(e.target.value)}
            className="font-mono text-sm font-bold bg-white border border-[#D9D3CA] rounded px-2 py-0.5 text-[#17707F] focus:border-[#17707F] outline-none"
            title="Tap to change care time"
          />
        </div>
        <button
          type="button"
          onClick={() => setLogTime(getNowTime())}
          className="text-xs text-[#17707F] font-semibold hover:underline"
        >
          Set to now
        </button>
      </div>

      {/* Real-time Email Alert Banner (PRD F7) */}
      {activeAlertBanner && (
        <div className="bg-[#FFF5F5] border border-[#B3261E] rounded-lg p-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-[#B3261E]">
            <Mail className="w-4 h-4 shrink-0" />
            <span>
              <strong>Emergency email alert sent to family:</strong> {activeAlertBanner.reason}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewAlert(activeAlertBanner)}
              className="px-2.5 py-1 bg-[#B3261E] text-white font-bold rounded text-[11px] hover:bg-[#8f1e18] shadow-xs"
            >
              Preview Sent Email
            </button>
            <button
              type="button"
              onClick={() => setActiveAlertBanner(null)}
              className="text-[#7A7268] hover:text-[#3A342D] px-1 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* ================= SECTION 1: VITALS ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                1. Vital signs
              </h2>
            </div>
            {statusVitals.state === 'saved' && (
              <span className={`text-xs font-bold flex items-center gap-1 ${statusVitals.isOffline ? 'text-[#17707F]' : 'text-[#16A34A]'}`}>
                {statusVitals.isOffline ? <Radio className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {statusVitals.msg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveVitals} className="space-y-4">
            {/* Blood Pressure */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A342D]">
                  Blood pressure (mmHg)
                </label>
                {bpOutOfRange && (
                  <span className="text-xs font-bold text-[#B3261E] bg-[#FEE2E2] px-1.5 py-0.5 rounded">
                    [!] Out of normal range (90–139 / 60–89)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Systolic (e.g. 128)"
                  value={bpSys}
                  onChange={(e) => setBpSys(e.target.value)}
                  className={`h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                    bpOutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                  } focus:border-[#17707F] outline-none`}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Diastolic (e.g. 82)"
                  value={bpDia}
                  onChange={(e) => setBpDia(e.target.value)}
                  className={`h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                    bpOutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                  } focus:border-[#17707F] outline-none`}
                />
              </div>
            </div>

            {/* Pulse & SpO2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  Pulse (bpm) {pulseOutOfRange && <span className="text-[#B3261E] font-bold">[!]</span>}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="60–100"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className={`w-full h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                    pulseOutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                  } focus:border-[#17707F] outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  SpO2 (%) {spo2OutOfRange && <span className="text-[#B3261E] font-bold">[!] Low</span>}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="94–100"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className={`w-full h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                    spo2OutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                  } focus:border-[#17707F] outline-none`}
                />
              </div>
            </div>

            {/* Blood Sugar & Timing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  Blood sugar (mg/dL) {sugarOutOfRange && <span className="text-[#B3261E] font-bold">[!]</span>}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 110"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className={`w-full h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                    sugarOutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                  } focus:border-[#17707F] outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  Timing tag
                </label>
                <select
                  value={sugarTiming}
                  onChange={(e) => setSugarTiming(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#D9D3CA] rounded text-sm text-[#3A342D] focus:border-[#17707F] outline-none"
                >
                  <option value="fasting">Fasting (70–130)</option>
                  <option value="beforeMeal">Before meal (70–130)</option>
                  <option value="afterMeal">After meal (&lt;180)</option>
                </select>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                Temperature (°F) {tempOutOfRange && <span className="text-[#B3261E] font-bold">[!] High</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 98.4"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className={`w-full h-11 px-3 bg-[#F1F3F2]/50 border rounded text-base font-mono tabular-nums ${
                  tempOutOfRange ? 'border-[#B3261E] bg-[#FFF5F5]' : 'border-[#D9D3CA]'
                } focus:border-[#17707F] outline-none`}
              />
            </div>

            {statusVitals.state === 'error' && (
              <p className="text-xs text-[#B3261E]">{statusVitals.msg}</p>
            )}

            <button
              type="submit"
              disabled={statusVitals.state === 'saving'}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition-colors"
            >
              {statusVitals.state === 'saving' ? 'Saving vitals…' : 'Save vitals entry'}
            </button>
          </form>
        </section>

        {/* ================= SECTION 2: MEALS ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                2. Meals & hydration
              </h2>
            </div>
            {statusMeal.state === 'saved' && (
              <span className={`text-xs font-bold flex items-center gap-1 ${statusMeal.isOffline ? 'text-[#17707F]' : 'text-[#16A34A]'}`}>
                {statusMeal.isOffline ? <Radio className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {statusMeal.msg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveMeal} className="space-y-4">
            <div className="flex gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2 text-xs font-bold capitalize rounded-md border transition-colors ${
                    mealType === type
                      ? 'bg-[#17707F] text-white border-[#17707F]'
                      : 'bg-[#F1F3F2] text-[#3A342D] border-[#D9D3CA] hover:bg-[#D9D3CA]/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                What was eaten (free text)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Poha, 1 boiled egg, warm milk"
                value={mealItems}
                onChange={(e) => setMealItems(e.target.value)}
                className="w-full h-11 px-3 bg-[#F1F3F2]/50 border border-[#D9D3CA] rounded text-sm text-[#3A342D] focus:border-[#17707F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-2">
                Portion completed
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'quarter', label: '1/4' },
                  { id: 'half', label: '1/2' },
                  { id: 'most', label: 'Most' },
                  { id: 'all', label: 'All' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPortion(p.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md border transition-colors ${
                      portion === p.id
                        ? 'bg-[#D3ECF0] border-[#17707F] text-[#17707F] font-bold'
                        : 'bg-white border-[#D9D3CA] text-[#3A342D]'
                    }`}
                  >
                    <PlateGlyph portion={p.id} className="w-4 h-4 mb-1" />
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                Water added (ml)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  className="w-24 h-11 px-3 bg-[#F1F3F2]/50 border border-[#D9D3CA] rounded text-base font-mono tabular-nums text-[#3A342D]"
                />
                <button
                  type="button"
                  onClick={() => setWaterMl(prev => Number(prev || 0) + 100)}
                  className="px-3 h-11 bg-[#F1F3F2] border border-[#D9D3CA] rounded text-xs font-semibold hover:bg-[#D9D3CA]/50"
                >
                  +100 ml (sip)
                </button>
                <button
                  type="button"
                  onClick={() => setWaterMl(prev => Number(prev || 0) + 250)}
                  className="px-3 h-11 bg-[#F1F3F2] border border-[#D9D3CA] rounded text-xs font-semibold hover:bg-[#D9D3CA]/50"
                >
                  +250 ml (glass)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={statusMeal.state === 'saving'}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition-colors"
            >
              Save meal entry
            </button>
          </form>
        </section>

        {/* ================= SECTION 3: MEDICINES ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                3. Scheduled medicines
              </h2>
            </div>
          </div>

          {loadingSchedule ? (
            <p className="text-xs text-[#7A7268]">Loading schedule…</p>
          ) : (
            <div className="space-y-3">
              {scheduledItems.map((item, idx) => {
                const logged = item.loggedEntry;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#F1F3F2]/60 rounded-lg border border-[#D9D3CA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#3A342D] text-[#F1F3F2] px-1.5 py-0.5 rounded">
                          {item.scheduledTime}
                        </span>
                        <span className="font-bold text-sm text-[#3A342D]">
                          {item.name} {item.dose}
                        </span>
                      </div>
                      {item.instructions && (
                        <p className="text-xs text-[#7A7268] mt-0.5">
                          {item.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {logged ? (
                        logged.status === 'given' ? (
                          <span className="text-xs font-bold text-[#17707F] bg-[#D3ECF0] px-2.5 py-1 rounded">
                            ✓ Given at {logged.givenAt}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#B3261E] bg-[#FEE2E2] px-2.5 py-1 rounded">
                            ✕ Missed ({logged.reason})
                          </span>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarkMedicine(item, 'given')}
                            className="px-3 py-1.5 bg-[#17707F] text-white text-xs font-bold rounded hover:bg-[#135d6a] transition-colors"
                          >
                            Mark given
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Reason for missed dose (e.g. refused, sleeping, unavailable):', 'refused');
                              if (reason !== null) {
                                handleMarkMedicine(item, 'missed', reason);
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-[#B3261E] text-[#B3261E] text-xs font-bold rounded hover:bg-[#FEE2E2]/60 transition-colors"
                          >
                            Mark missed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= SECTION 4: ACTIVITY ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                4. Physical activity & therapy
              </h2>
            </div>
            {statusActivity.state === 'saved' && (
              <span className={`text-xs font-bold flex items-center gap-1 ${statusActivity.isOffline ? 'text-[#17707F]' : 'text-[#16A34A]'}`}>
                {statusActivity.isOffline ? <Radio className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {statusActivity.msg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  Activity type
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#D9D3CA] rounded text-sm text-[#3A342D] focus:border-[#17707F] outline-none"
                >
                  <option value="Walk">Walk</option>
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="Exercise">Exercise</option>
                  <option value="Outing">Outing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                  Minutes ({activityMinutes} min)
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={activityMinutes}
                  onChange={(e) => setActivityMinutes(e.target.value)}
                  className="w-full accent-[#17707F] mt-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                Optional activity note
              </label>
              <input
                type="text"
                placeholder="e.g. Garden walk with walker, good posture"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                className="w-full h-11 px-3 bg-[#F1F3F2]/50 border border-[#D9D3CA] rounded text-sm text-[#3A342D]"
              />
            </div>

            <button
              type="submit"
              disabled={statusActivity.state === 'saving'}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition-colors"
            >
              Save activity entry
            </button>
          </form>
        </section>

        {/* ================= SECTION 5: MOOD ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                5. Patient mood
              </h2>
            </div>
            {statusMood.state === 'saved' && (
              <span className={`text-xs font-bold flex items-center gap-1 ${statusMood.isOffline ? 'text-[#17707F]' : 'text-[#16A34A]'}`}>
                {statusMood.isOffline ? <Radio className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {statusMood.msg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveMood} className="space-y-4">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { id: 'low', label: 'Low' },
                { id: 'down', label: 'Down' },
                { id: 'steady', label: 'Steady' },
                { id: 'good', label: 'Good' },
                { id: 'cheerful', label: 'Cheerful' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMoodScale(m.id)}
                  className={`py-2 px-1 rounded-md text-xs font-bold text-center border transition-colors ${
                    moodScale === m.id
                      ? 'bg-[#17707F] text-white border-[#17707F]'
                      : 'bg-white text-[#3A342D] border-[#D9D3CA] hover:bg-[#D9D3CA]/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                Optional context word
              </label>
              <input
                type="text"
                placeholder="e.g. asked about daughter, smiled warmly"
                value={moodContext}
                onChange={(e) => setMoodContext(e.target.value)}
                className="w-full h-11 px-3 bg-[#F1F3F2]/50 border border-[#D9D3CA] rounded text-sm text-[#3A342D]"
              />
            </div>

            <button
              type="submit"
              disabled={statusMood.state === 'saving'}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition-colors"
            >
              Record mood
            </button>
          </form>
        </section>

        {/* ================= SECTION 6: OBSERVATIONS & PHOTOS ================= */}
        <section className="bg-white rounded-xl border border-[#D9D3CA] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D9D3CA]/50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#17707F]" />
              <h2 className="font-serif text-lg font-bold text-[#3A342D]">
                6. Nurse clinical observation
              </h2>
            </div>
            {statusNote.state === 'saved' && (
              <span className={`text-xs font-bold flex items-center gap-1 ${statusNote.isOffline ? 'text-[#17707F]' : 'text-[#16A34A]'}`}>
                {statusNote.isOffline ? <Radio className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {statusNote.msg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1">
                Your words (shown directly in family timeline)
              </label>
              <textarea
                rows={3}
                required
                placeholder="What did you notice during this round? (e.g. Kamla rested well after tea and asked about Neha...)"
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                className="w-full p-3 bg-[#F1F3F2]/50 border border-[#D9D3CA] rounded text-base text-[#3A342D] focus:border-[#17707F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A342D] mb-1.5">
                Attach photo (optional, up to 3)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 px-3 py-2 bg-[#F1F3F2] border border-[#D9D3CA] rounded-md text-xs font-semibold cursor-pointer hover:bg-[#D9D3CA]/50">
                  <Camera className="w-4 h-4 text-[#17707F]" />
                  <span>{uploadingPhoto ? 'Uploading…' : 'Take / Upload photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {attachedPhotos.map((url, i) => (
                  <div key={i} className="relative w-11 h-11 rounded border border-[#D9D3CA] overflow-hidden">
                    <img src={url} alt="attached" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0 right-0 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-bl"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={statusNote.state === 'saving'}
              className="w-full h-11 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] font-semibold text-sm rounded-md transition-colors"
            >
              Save observation note
            </button>
          </form>
        </section>
      </div>

      {/* In-app Email Preview Modal (opened from banner) */}
      {previewAlert && (
        <EmailPreviewModal
          alert={previewAlert}
          onClose={() => setPreviewAlert(null)}
        />
      )}
    </div>
  );
}
