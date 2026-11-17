import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid
} from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

// Custom dot for Recharts that visibly renders out-of-range red diamond + label
const CustomOutRangeDot = (props) => {
  const { cx, cy, payload, dataKey } = props;
  if (!cx || !cy) return null;

  const isOOR = payload.isOutOfRange;
  const val = payload[dataKey];

  if (isOOR) {
    return (
      <g>
        {/* Red diamond */}
        <polygon
          points={`${cx},${cy - 6} ${cx + 6},${cy} ${cx},${cy + 6} ${cx - 6},${cy}`}
          fill="#B3261E"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        {/* Value printed beside diamond */}
        <text
          x={cx + 8}
          y={cy + 4}
          fill="#B3261E"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {val}
        </text>
      </g>
    );
  }

  // Normal in-range dot
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#46B3C6"
      stroke="#17707F"
      strokeWidth={1.5}
    />
  );
};

export default function VitalCharts({ patient }) {
  const [days, setDays] = useState(7); // 7 or 30
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVitals() {
      if (!patient?._id) return;
      setLoading(true);
      try {
        const res = await apiRequest(`/patients/${patient._id}/vitals?days=${days}`);
        setData(res);
      } catch (err) {
        console.error('Failed to fetch vitals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVitals();
  }, [patient?._id, days]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 text-[#3A342D]">
      {/* Header and Two-Part Days Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D9D3CA]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#3A342D]">
            Vital sign trends
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7268] mt-0.5">
            Target normal bands shaded in calm aqua. Out-of-range incidents marked with red diamonds.
          </p>
        </div>

        {/* Two-Part 7 / 30 Days Control */}
        <div className="flex items-center bg-[#D9D3CA]/60 p-1 rounded-md border border-[#D9D3CA] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              days === 7 ? 'bg-[#17707F] text-[#F1F3F2] shadow-xs' : 'text-[#3A342D] hover:text-[#17707F]'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              days === 30 ? 'bg-[#17707F] text-[#F1F3F2] shadow-xs' : 'text-[#3A342D] hover:text-[#17707F]'
            }`}
          >
            30 days
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#7A7268]">
          <div className="w-8 h-8 border-4 border-[#D9D3CA] border-t-[#17707F] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Calculating trend series…</p>
        </div>
      ) : !data ? (
        <p className="text-center py-10 text-sm text-[#7A7268]">No vital records available for this window.</p>
      ) : (
        <div className="space-y-8">
          {/* --- 1. Blood Pressure Chart (Systolic and Diastolic together) --- */}
          <div className="bg-white rounded-xl border border-[#D9D3CA] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-base font-bold text-[#3A342D]">
                Blood pressure (mmHg)
              </span>
              <span className="text-xs text-[#7A7268]">
                Normal band: 90–139 / 60–89 mmHg
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series.bloodPressure} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#A89E91" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <YAxis domain={[50, 170]} tick={{ fontSize: 11, fill: '#7A7268' }} />
                  {/* Shaded Normal Range Band for Systolic (90-139) */}
                  <ReferenceArea y1={90} y2={139} fill="#D3ECF0" fillOpacity={0.65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F1F3F2', borderColor: '#D9D3CA', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic"
                    stroke="#17707F"
                    strokeWidth={2}
                    dot={<CustomOutRangeDot dataKey="systolic" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke="#46B3C6"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: '#46B3C6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs text-[#7A7268] pt-2 border-t border-[#D9D3CA]/40">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#17707F]" /> Systolic</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#46B3C6]" /> Diastolic</span>
              </div>
              <span className="text-[11px] font-medium text-[#17707F]">Aqua band: Normal target</span>
            </div>
          </div>

          {/* --- 2. Pulse Rate Chart --- */}
          <div className="bg-white rounded-xl border border-[#D9D3CA] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-base font-bold text-[#3A342D]">
                Pulse rate (bpm)
              </span>
              <span className="text-xs text-[#7A7268]">
                Normal band: 60–100 bpm
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series.pulse} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#A89E91" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <YAxis domain={[50, 120]} tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <ReferenceArea y1={60} y2={100} fill="#D3ECF0" fillOpacity={0.65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F1F3F2', borderColor: '#D9D3CA', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pulse"
                    name="Pulse"
                    stroke="#17707F"
                    strokeWidth={2}
                    dot={<CustomOutRangeDot dataKey="pulse" />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- 3. Blood Sugar Chart --- */}
          <div className="bg-white rounded-xl border border-[#D9D3CA] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-base font-bold text-[#3A342D]">
                Blood sugar (mg/dL)
              </span>
              <span className="text-xs text-[#7A7268]">
                Fasting: 70–130 | Post-meal: &lt;180
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series.bloodSugar} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#A89E91" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <YAxis domain={[60, 220]} tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <ReferenceArea y1={70} y2={130} fill="#D3ECF0" fillOpacity={0.65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F1F3F2', borderColor: '#D9D3CA', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bloodSugar"
                    name="Blood Sugar"
                    stroke="#17707F"
                    strokeWidth={2}
                    dot={<CustomOutRangeDot dataKey="bloodSugar" />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- 4. Oxygen SpO2 Chart --- */}
          <div className="bg-white rounded-xl border border-[#D9D3CA] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-base font-bold text-[#3A342D]">
                Blood oxygen SpO2 (%)
              </span>
              <span className="text-xs text-[#7A7268]">
                Normal band: 94–100 %
              </span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series.spo2} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#A89E91" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#7A7268' }} />
                  <ReferenceArea y1={94} y2={100} fill="#D3ECF0" fillOpacity={0.65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F1F3F2', borderColor: '#D9D3CA', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO2"
                    stroke="#17707F"
                    strokeWidth={2}
                    dot={<CustomOutRangeDot dataKey="spo2" />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
