import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';
import {
  Pill,
  Utensils,
  Activity,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function WeeklySummary({ patient, selectedDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeekly() {
      if (!patient?._id) return;
      setLoading(true);
      try {
        const res = await apiRequest(`/patients/${patient._id}/weekly?weekOf=${selectedDate}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load weekly summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeekly();
  }, [patient?._id, selectedDate]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#7A7268]">
        <div className="w-8 h-8 border-4 border-[#D9D3CA] border-t-[#17707F] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Compiling weekly summary…</p>
      </div>
    );
  }

  if (!data) return null;

  const { current, previous, diff, weekRange } = data;

  const renderDelta = (deltaValue, suffix = '') => {
    if (deltaValue > 0) {
      return (
        <span className="inline-flex items-center text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{deltaValue}{suffix} vs last week</span>
        </span>
      );
    }
    if (deltaValue < 0) {
      return (
        <span className="inline-flex items-center text-xs font-bold text-[#B3261E] bg-[#FEE2E2] px-2 py-0.5 rounded">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>{deltaValue}{suffix} vs last week</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-medium text-[#7A7268] bg-[#F1F3F2] px-2 py-0.5 rounded">
        <Minus className="w-3 h-3 mr-1" />
        <span>Same as last week</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 text-[#3A342D]">
      {/* Title & Week Range */}
      <div className="pb-4 mb-6 border-b border-[#D9D3CA]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#17707F] uppercase tracking-wider mb-1">
          <Calendar className="w-4 h-4" />
          <span>Week of {weekRange.start} to {weekRange.end}</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#3A342D]">
          Weekly care summary
        </h2>
        <p className="text-sm text-[#7A7268] mt-1">
          Comparison with preceding 7-day period for clinical continuity.
        </p>
      </div>

      {/* The 4 Core Weekly Measures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* 1. Medicine Adherence */}
        <div className="bg-white rounded-xl border border-[#D9D3CA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#17707F]" />
              Medicine adherence
            </span>
            {renderDelta(diff.adherence, '%')}
          </div>
          <div className="text-3xl font-serif font-bold text-[#3A342D] tabular-nums my-1">
            {current.adherencePercent}%
          </div>
          <p className="text-xs text-[#7A7268]">
            {current.givenCount} of {current.scheduledCount} scheduled doses given.
            {current.missedCount > 0 && (
              <span className="text-[#B3261E] font-semibold ml-1">
                ({current.missedCount} missed with reasons logged)
              </span>
            )}
          </p>
        </div>

        {/* 2. Meals Completed */}
        <div className="bg-white rounded-xl border border-[#D9D3CA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-[#17707F]" />
              Main meals completed
            </span>
            {renderDelta(diff.completedMeals, ' meals')}
          </div>
          <div className="text-3xl font-serif font-bold text-[#3A342D] tabular-nums my-1">
            {current.completedMeals} / 21
          </div>
          <p className="text-xs text-[#7A7268]">
            Main meals (breakfast, lunch, dinner) eaten most or fully.
          </p>
        </div>

        {/* 3. Physical Activity */}
        <div className="bg-white rounded-xl border border-[#D9D3CA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#17707F]" />
              Activity minutes
            </span>
            {renderDelta(diff.activityMinutes, 'm')}
          </div>
          <div className="text-3xl font-serif font-bold text-[#3A342D] tabular-nums my-1">
            {current.totalActivityMinutes} mins
          </div>
          <p className="text-xs text-[#7A7268]">
            Sum of walking sessions and assisted physiotherapy exercises.
          </p>
        </div>

        {/* 4. Mood Trend */}
        <div className="bg-white rounded-xl border border-[#D9D3CA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#17707F]" />
              Average mood
            </span>
            {renderDelta(diff.moodScore)}
          </div>
          <div className="text-3xl font-serif font-bold text-[#3A342D] capitalize my-1">
            {current.weeklyAvgMoodLabel}
          </div>
          <p className="text-xs text-[#7A7268]">
            Rated across 5-step scale: Low, Down, Steady, Good, Cheerful.
          </p>
        </div>
      </div>

      {/* 7-Point Mood Line Chart */}
      <div className="bg-white rounded-xl border border-[#D9D3CA] p-5 shadow-xs">
        <h3 className="font-serif text-base font-bold text-[#3A342D] mb-1">
          7-Day Daily Mood Trajectory
        </h3>
        <p className="text-xs text-[#7A7268] mb-4">
          Shows day-to-day emotional well-being logged by visiting nurse.
        </p>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={current.moodPoints} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A7268' }} tickFormatter={(d) => d.substring(5)} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v) => ['', 'Low', 'Down', 'Steady', 'Good', 'Cheerful'][v]}
                tick={{ fontSize: 10, fill: '#7A7268' }}
              />
              <Tooltip
                formatter={(val) => ['', 'Low', 'Down', 'Steady', 'Good', 'Cheerful'][Math.round(val)]}
                contentStyle={{ backgroundColor: '#F1F3F2', borderColor: '#D9D3CA', borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Mood Score"
                stroke="#17707F"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#46B3C6', stroke: '#17707F' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
