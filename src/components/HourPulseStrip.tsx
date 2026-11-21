import React from 'react';
import {
  TrainEvaluation,
  ScheduleDay,
  fmtHour,
  fmtHourCompact,
} from '../utils/transitSchedule';

interface HourPulseStripProps {
  hoursMap: Map<number, TrainEvaluation[]>;
  day: ScheduleDay;
  delay: number;
  visibleHours: Set<number>;
  onSelectHour: (hr: number) => void;
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM

export const HourPulseStrip: React.FC<HourPulseStripProps> = ({
  hoursMap,
  day,
  delay,
  visibleHours,
  onSelectHour,
}) => {
  return (
    <section
      id="pulse"
      aria-labelledby="pulse-heading"
      className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="pulse-heading"
          className="text-[16px] font-bold tracking-tight text-slate-900"
        >
          {day === 'weekday' ? 'Weekday (Mon–Fri)' : 'Weekend (Sat & Sun)'} Hour-by-Hour Winner
          &amp; Short-Turn Pulse (5 AM – 11 PM)
          {delay > 0 ? ` — W Line +${delay}m Late` : ''}
        </h2>
        <p className="text-xs text-slate-500">
          Select any hour column to jump straight to its Branching Trunk Gantt card
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[790px] grid-cols-19 gap-1.5"
          role="navigation"
          aria-label="Jump to hour section"
        >
          {HOURS.map((hr) => {
            const evs = hoursMap.get(hr) ?? [];
            const hasShort = evs.some((e) => e.train.short);
            const hasOre = evs.some((e) => e.C.available);
            const hasTrap = evs.some(
              (e) =>
                e.A.status === 'missed' ||
                e.A.status === 'sprint' ||
                (e.C.available && e.C.zeroHoldRisk)
            );

            const counts = { A: 0, B: 0, C: 0 };
            evs.forEach((e) => e.winners.forEach((w) => counts[w]++));

            let bgClass = 'bg-blue-50/75 hover:bg-blue-50';
            let textClass = 'text-blue-700';
            let winTxt = 'A';

            if (evs.length === 0) {
              bgClass = 'bg-slate-50';
              textClass = 'text-slate-400';
              winTxt = '—';
            } else if (counts.C > counts.A && counts.C >= counts.B) {
              bgClass = 'bg-amber-50/85 hover:bg-amber-50';
              textClass = 'text-amber-800';
              winTxt = 'C';
            } else if (counts.B > counts.A) {
              bgClass = 'bg-indigo-50/80 hover:bg-indigo-50';
              textClass = 'text-indigo-800';
              winTxt = 'B';
            } else if (counts.A > 0 && counts.B === counts.A) {
              bgClass = 'bg-emerald-50/80 hover:bg-emerald-50';
              textClass = 'text-emerald-800';
              winTxt = 'A=B';
            }

            const avgBest =
              evs.length > 0
                ? Math.round(evs.reduce((acc, e) => acc + e.minDur, 0) / evs.length)
                : 0;
            const isVisible = visibleHours.has(hr);

            return (
              <button
                key={hr}
                type="button"
                disabled={!isVisible}
                onClick={() => onSelectHour(hr)}
                aria-label={`Jump to ${fmtHour(hr)}: fastest ${winTxt}, average ${avgBest} minutes${hasShort ? ', includes Federal Center short-turn' : ''}${hasTrap ? ', includes tight sprint or near-miss' : ''}`}
                className={`group flex flex-col items-center justify-between rounded-lg border px-1 py-2 text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00778B] ${bgClass} ${
                  hasShort ? 'border-red-300' : 'border-slate-200'
                } ${
                  isVisible
                    ? 'cursor-pointer hover:border-slate-900'
                    : 'cursor-not-allowed opacity-40'
                }`}
              >
                <span className="font-mono text-[11px] font-bold tabular-nums text-slate-900">
                  {fmtHourCompact(hr)}
                </span>
                <span className={`mt-1 text-[13px] font-extrabold leading-none ${textClass}`}>
                  {winTxt}
                </span>
                <span className="mt-1 font-mono text-[10px] tabular-nums text-slate-600">
                  {avgBest ? `${avgBest}m` : '—'}
                </span>
                <span className="mt-1 flex h-3.5 items-center justify-center gap-1 font-mono text-[10px] font-extrabold leading-none">
                  {hasShort && (
                    <span className="text-red-600" title="Short-Turn at Federal Center">
                      ⛔
                    </span>
                  )}
                  {hasTrap && (
                    <span className="text-amber-700" title="Tight Sprint or Near-Miss">
                      !
                    </span>
                  )}
                </span>
                <span
                  className={`mt-1.5 h-1 w-4/5 rounded-xs ${
                    hasOre ? 'bg-slate-600' : 'bg-slate-200'
                  }`}
                  title={hasOre ? 'Ore Cart Active' : 'Ore Cart Closed'}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-slate-500">
        <span>
          <strong className="font-semibold text-blue-700">A</strong> Oak → 17
        </span>
        <span>
          <strong className="font-semibold text-indigo-800">B</strong> Fed Ctr → 17
        </span>
        <span>
          <strong className="font-semibold text-amber-800">C</strong> Jeffco → Tungsten
        </span>
        <span>
          <strong className="font-semibold text-emerald-800">A=B</strong> Same-bus tie
        </span>
        <span aria-hidden="true" className="text-slate-300">
          |
        </span>
        <span>
          <span className="font-semibold text-red-600">⛔</span> Short-turn in hour
        </span>
        <span>
          <span className="font-bold text-amber-700">!</span> Tight sprint / 0m hold
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-xs bg-slate-600" /> Ore Cart active bar
        </span>
      </div>
    </section>
  );
};
