import React from 'react';
import { Mail, ExternalLink, ShieldCheck, X } from 'lucide-react';

export default function EmailPreviewModal({ alert, onClose }) {
  if (!alert) return null;

  const subject = alert.subject || `[TheCarePal Alert] Care update for Kamla Sharma: Out of range vital`;
  const reason = alert.reason || 'Reading out of range';
  const timeStr = alert.sentAt ? new Date(alert.sentAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB');

  return (
    <div className="fixed inset-0 z-50 bg-[#3A342D]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#D9D3CA] max-w-xl w-full shadow-2xl overflow-hidden text-[#3A342D] animate-in fade-in zoom-in-95">
        {/* Email Client Header Chrome */}
        <div className="bg-[#3A342D] text-[#F1F3F2] px-4 py-3 flex items-center justify-between border-b border-[#D9D3CA]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#46B3C6]" />
            <span className="text-xs font-mono font-medium">Family Inbox · Incoming Alert</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#D9D3CA] hover:text-white px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>

        {/* Email Meta Info */}
        <div className="bg-[#F8F9FA] p-4 border-b border-[#D9D3CA] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#7A7268]">From:</span>
            <span className="font-semibold text-[#3A342D]">TheCarePal Alerts &lt;alerts@thecarepal.com&gt;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7268]">To:</span>
            <span className="font-semibold text-[#17707F]">Neha Sharma &lt;family@thecarepal.com&gt;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7268]">Date:</span>
            <span className="text-[#3A342D] tabular-nums">{timeStr} IST</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#D9D3CA]/40">
            <span className="text-[#7A7268]">Subject:</span>
            <span className="font-bold text-[#B3261E]">{subject}</span>
          </div>
        </div>

        {/* Rendered Email Body */}
        <div className="p-6 bg-[#F1F3F2]">
          <div className="bg-[#3A342D] text-[#F1F3F2] p-4 rounded-t-lg">
            <h2 className="text-base font-bold font-serif">TheCarePal Clinical Care Alert</h2>
            <p className="text-xs text-[#D3ECF0] mt-0.5">Patient: Kamla Sharma (78 yrs, Bhopal) · Shift of Nurse Rekha Yadav</p>
          </div>

          <div className="bg-white p-5 rounded-b-lg border border-[#D9D3CA] border-t-0 space-y-3 text-xs leading-relaxed">
            <p className="text-sm font-medium">Hello Neha,</p>
            <p className="text-[#3A342D]">
              A care reading logged during today's visit requires your attention:
            </p>

            <div className="bg-[#FFF5F5] border-l-4 border-[#B3261E] p-3 rounded">
              <span className="font-bold text-[#B3261E] block mb-1">Incident Details:</span>
              <span className="text-sm font-bold text-[#3A342D]">{reason}</span>
            </div>

            <p className="text-[#7A7268]">
              Recorded by visiting nurse Rekha Yadav. The reading has been cataloged in your family care timeline and factored into Kamla's weekly adherence score.
            </p>

            <div className="pt-2 text-center">
              <span className="inline-block bg-[#17707F] text-white px-4 py-2 rounded font-bold text-xs">
                Open CarePal Dashboard
              </span>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#7A7268] mt-3">
            Recorded by care staff. Not a medical diagnosis. Reference ranges are demo defaults.
          </p>
        </div>

        {/* Footer controls */}
        <div className="bg-[#F8F9FA] px-4 py-3 border-t border-[#D9D3CA] flex items-center justify-between text-xs">
          {alert.previewUrl ? (
            <a
              href={alert.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#17707F] font-bold hover:underline flex items-center gap-1.5"
            >
              <span>Open on Ethereal Webmail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[#16A34A] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Delivered to family@thecarepal.com</span>
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#3A342D] text-white rounded text-xs font-semibold hover:bg-black"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
