import React, { useState } from 'react';
import { Download, Printer, FileText, Check, Shield } from 'lucide-react';

export default function ReportModal({ patient, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/patients/${patient._id}/report?days=30`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carepal-report-30days-${patient.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not download report PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3A342D]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F1F3F2] rounded-xl border border-[#D9D3CA] p-6 max-w-lg w-full shadow-2xl text-[#3A342D]">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9D3CA]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#17707F]" />
            <h3 className="font-serif text-xl font-bold text-[#3A342D]">
              Doctor's 30-day care report
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

        <div className="py-4 space-y-4">
          <p className="text-sm text-[#3A342D]">
            Prepared for clinical visits with Dr. Verma or consulting geriatrician. Summarizes 30 days of daily logs recorded by visiting nurse Rekha Yadav.
          </p>

          <div className="bg-white rounded-lg border border-[#D9D3CA] p-4 space-y-2 text-xs">
            <div className="font-bold text-[#3A342D] text-sm">Included in this document:</div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Full vitals table with Min, Max, Average and target normal ranges</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Complete out-of-range incident log with date, time and value</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Medication adherence by week with documented missed dose reasons</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Nutrition completion, activity hours and nurse clinical observations</span>
            </div>
          </div>

          <div className="bg-[#D3ECF0]/50 rounded p-3 text-xs text-[#17707F] flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Formatted to print cleanly on black & white clinic printers. Uses text labels and geometric markers so no meaning is lost without color.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#D9D3CA] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-[#D9D3CA] text-[#3A342D] rounded-md text-xs font-semibold hover:bg-[#D9D3CA]/50 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print screen</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2 bg-[#17707F] hover:bg-[#135d6a] text-[#F1F3F2] rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-75"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating PDF…' : 'Download 30-day PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
