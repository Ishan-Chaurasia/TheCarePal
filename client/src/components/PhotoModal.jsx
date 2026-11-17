import React from 'react';

export default function PhotoModal({ photoUrl, onClose }) {
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3A342D]/85 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl border border-[#D9D3CA]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#D9D3CA] bg-[#F1F3F2]">
          <span className="text-xs font-bold text-[#3A342D]">Care photograph</span>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#7A7268] hover:text-[#3A342D] px-2"
          >
            ✕
          </button>
        </div>
        <div className="p-2 flex items-center justify-center bg-black/5">
          <img
            src={photoUrl}
            alt="Care event detail"
            className="max-h-[75vh] w-auto object-contain rounded"
          />
        </div>
      </div>
    </div>
  );
}
