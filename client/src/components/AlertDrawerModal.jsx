import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';
import { Bell, AlertTriangle, ExternalLink, Mail, Eye } from 'lucide-react';
import EmailPreviewModal from './EmailPreviewModal.jsx';

export default function AlertDrawerModal({ patientId, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    async function fetchAlerts() {
      if (!patientId) return;
      try {
        const res = await apiRequest(`/patients/${patientId}/alerts`);
        setAlerts(res || []);
      } catch (e) {
        console.error('Failed to fetch alerts:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [patientId]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#3A342D]/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#F1F3F2] rounded-xl border border-[#D9D3CA] p-6 max-w-lg w-full shadow-2xl text-[#3A342D]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D3CA]">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#B3261E]" />
              <h3 className="font-serif text-lg font-bold text-[#3A342D]">
                Family Email Notifications (F7)
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
              Whenever an out-of-range vital reading or missed medication is logged, an automated clinical alert email is sent to <code className="font-mono text-[#17707F]">family@thecarepal.com</code>.
            </p>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#7A7268]">Loading alert records…</div>
            ) : alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A7268]">
                No emergency alerts sent yet. Log an out-of-range reading or mark a dose missed to trigger an instant email alert.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {alerts.map((item, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-lg border border-[#D9D3CA] shadow-xs text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-[#B3261E] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.subject || 'Clinical Care Alert'}</span>
                      </span>
                      <span className="text-[11px] text-[#7A7268] tabular-nums shrink-0">
                        {new Date(item.sentAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#3A342D] bg-[#FFF5F5] p-2 rounded border-l-2 border-[#B3261E] mb-2">
                      {item.reason}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#7A7268] pt-1 border-t border-[#D9D3CA]/30">
                      <span>To: {item.recipients?.join(', ') || 'family@thecarepal.com'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(item)}
                          className="text-[#17707F] font-bold hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View email</span>
                        </button>
                        {item.previewUrl && (
                          <a
                            href={item.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#7A7268] hover:text-[#17707F]"
                            title="Open on Ethereal"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAlert && (
        <EmailPreviewModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </>
  );
}
