import React, { useState } from 'react';
import { apiRequest } from '../api.js';

export default function EditEntryModal({ patientId, entry, onClose, onUpdated }) {
  const [data, setData] = useState({ ...(entry.data || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/patients/${patientId}/entries/${entry._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ data })
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3A342D]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F1F3F2] rounded-xl border border-[#D9D3CA] p-6 max-w-md w-full shadow-2xl text-[#3A342D]">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9D3CA]">
          <h3 className="font-serif text-lg font-bold text-[#3A342D]">
            Edit same-day entry
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#7A7268] hover:text-[#3A342D]"
          >
            ✕ Close
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-[#FEE2E2] text-xs text-[#B3261E] rounded border-l-4 border-[#B3261E]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {entry.kind === 'vital' && entry.data?.vitalType === 'bloodPressure' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Systolic</label>
                <input
                  type="text"
                  value={data.systolic || ''}
                  onChange={(e) => setData({ ...data, systolic: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-[#D9D3CA] rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Diastolic</label>
                <input
                  type="text"
                  value={data.diastolic || ''}
                  onChange={(e) => setData({ ...data, diastolic: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-[#D9D3CA] rounded font-mono"
                />
              </div>
            </div>
          )}

          {entry.kind === 'vital' && entry.data?.vitalType !== 'bloodPressure' && (
            <div>
              <label className="block text-xs font-bold mb-1">Recorded Value ({data.unit || ''})</label>
              <input
                type="text"
                value={data.value || ''}
                onChange={(e) => setData({ ...data, value: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-white border border-[#D9D3CA] rounded font-mono"
              />
            </div>
          )}

          {entry.kind === 'meal' && (
            <div>
              <label className="block text-xs font-bold mb-1">What was eaten</label>
              <input
                type="text"
                value={data.items || ''}
                onChange={(e) => setData({ ...data, items: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-[#D9D3CA] rounded"
              />
            </div>
          )}

          {(entry.kind === 'observation' || entry.kind === 'note') && (
            <div>
              <label className="block text-xs font-bold mb-1">Nurse observation note</label>
              <textarea
                rows={3}
                value={data.text || data.note || ''}
                onChange={(e) => setData({ ...data, text: e.target.value, note: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#D9D3CA] rounded"
              />
            </div>
          )}

          <div className="pt-3 border-t border-[#D9D3CA] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-[#D9D3CA] text-xs font-semibold rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-[#17707F] text-white text-xs font-bold rounded shadow-xs"
            >
              {saving ? 'Saving…' : 'Save change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
