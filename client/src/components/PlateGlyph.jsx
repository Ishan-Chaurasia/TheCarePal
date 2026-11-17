import React from 'react';

/**
 * Small plate glyph in dark stone, filled by portion (none, quarter, half, most, all)
 * Per PRD FS-03 Day Sheet specifications.
 */
export default function PlateGlyph({ portion = 'all', className = 'w-5 h-5' }) {
  const norm = portion?.toLowerCase() || 'all';

  // SVG paths for circular plate wedge
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} inline-block shrink-0`}
      aria-label={`Meal portion: ${norm}`}
      role="img"
    >
      {/* Outer plate rim */}
      <circle cx="12" cy="12" r="10" stroke="#3A342D" strokeWidth="1.5" />
      {/* Inner plate rim */}
      <circle cx="12" cy="12" r="7.5" stroke="#D9D3CA" strokeWidth="0.75" />

      {/* Portion fills */}
      {norm === 'all' && (
        <circle cx="12" cy="12" r="7" fill="#3A342D" />
      )}
      {norm === 'most' && (
        <path
          d="M 12 12 L 12 5 A 7 7 0 1 1 5 12 Z"
          fill="#3A342D"
        />
      )}
      {norm === 'half' && (
        <path
          d="M 12 5 A 7 7 0 0 1 12 19 Z"
          fill="#3A342D"
        />
      )}
      {norm === 'quarter' && (
        <path
          d="M 12 12 L 12 5 A 7 7 0 0 1 19 12 Z"
          fill="#3A342D"
        />
      )}
      {norm === 'none' && null}
    </svg>
  );
}
