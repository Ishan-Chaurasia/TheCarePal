import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';
import { History, ShieldAlert } from 'lucide-react';

export default function AuditTrailModal({ patientId, entryId, onClose }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      if (!entryId) return;
      try {
        const res = await apiRequest(`/patients/${patientId}/entries/${entryId}/audit`);
        setAudits(res || []);
      } catch (err) {
        console.error('Failed to load audit history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, [patientId, entryId]);

  return (
    <div className="fixed inset-0 z-50 bg-[#3A342D]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F1F3F2] rounded-xl border border-[#D9D3CA] p-6 max-w-lg w-full shadow-2xl text-[#3A342D]">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9D3CA]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#17707F]" />
            <h3 className="font-serif text-lg font-bold text-[#3A342D]">
              Clinical Entry Audit Trail
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#7A7268] hover:text-[#3A342D]"
          >
            ✕ Close
          </button>
        </div>

        <div className="py-4">
          <p className="text-xs text-[#7A7268] mb-4">
            Under clinical governance guidelines, all adjustments and deletions to patient logs are cryptographically tracked with editor identity and timestamp.
          </p>

          {loading ? (
            <p className="text-center py-6 text-xs text-[#7A7268]">Retrieving audit trail…</p>
          ) : audits.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#7A7268]">No prior modifications logged for this entry.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {audits.map((a, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-[#D9D3CA] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#17707F]">
                      Action: {a.action || 'EDIT'}
                    </span>
                    <span className="text-[#7A7268] tabular-nums">
                      {new Date(a.at).toLocaleString('en-GB')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#3A342D] mb-1.5">
                    Modified by: <span className="font-semibold">{a.editorName || 'Author'}</span>
                  </p>
                  {a.before?.data && (
                    <div className="bg-[#F1F3F2] p-2 rounded text-[11px] font-mono">
                      <div><strong className="text-red-700">Before:</strong> {JSON.stringify(a.before.data)}</div>
                      {a.after?.data && (
                        <div><strong className="text-green-700">After:</strong> {JSON.stringify(a.after.data)}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
