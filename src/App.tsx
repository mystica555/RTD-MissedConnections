import React, { useMemo, useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import {
  DisplayMode,
  ScheduleDay,
  WalkMode,
  buildR17,
  buildTungsten,
  buildWLine,
  computeSummaryStats,
  evaluateTrain,
  filterEvaluationsInHour,
  fmtHour,
  groupByHour,
} from './utils/transitSchedule';
import { CorridorMap } from './components/CorridorMap';
import { HourPulseStrip } from './components/HourPulseStrip';
import { GanttCard } from './components/GanttCard';
import { TooltipData, TooltipOverlay } from './components/TooltipOverlay';

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

export default function App() {
  const [day, setDay] = useState<ScheduleDay>('weekday');
  const [mode, setMode] = useState<DisplayMode>('hourly');
  const [walkMode, setWalkMode] = useState<WalkMode>('both');
  const [delay, setDelay] = useState<number>(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { evaluated, hoursMap, stats, hourSections, visibleHours } = useMemo(() => {
    const allW = buildWLine(day);
    const r17List = buildR17(day);
    const tungList = buildTungsten(day);
    const evals = allW.map((tr) =>
      evaluateTrain(tr, allW, r17List, tungList, delay, walkMode)
    );
    const hMap = groupByHour(evals);
    const summary = computeSummaryStats(evals);

    const sections = HOURS.map((hr) => {
      const evs = hMap.get(hr) ?? [];
      if (evs.length === 0) return null;
      const shown = filterEvaluationsInHour(evs, mode);
      if (shown.length === 0) return null;
      return {
        hr,
        evs,
        shown,
        hasShort: evs.some((e) => e.train.short),
        hasOre: evs.some((e) => e.C.available),
        regimeLabel: evs[0].train.regime,
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      evaluated: evals,
      hoursMap: hMap,
      stats: summary,
      hourSections: sections,
      visibleHours: new Set(sections.map((s) => s.hr)),
    };
  }, [day, mode, walkMode, delay]);

  const handleSelectHour = (hr: number) => {
    const el = document.getElementById(`hour-${hr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setMode('hourly');
    setDelay(0);
    setWalkMode('both');
  };

  const delayLabel = delay === 0 ? 'On Time' : `+${delay} min`;
  const delayToneClass =
    delay === 0
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : delay <= 2
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-red-50 text-red-800 border-red-200';

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900">
      {/* TOP BAR CONTRACT — 3 Zones: Wordmark | 4 single-line links | 1 primary CTA */}
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 sm:gap-8 sm:px-6 sm:py-3.5">
          <a
            href="#top"
            className="shrink-0 whitespace-nowrap font-display text-[15.5px] font-extrabold tracking-tight text-slate-900 sm:text-[17px]"
          >
            RTD Golden Transfer Atlas
          </a>

          <nav
            aria-label="Page sections"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
          >
            <a
              href="#topology"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900 hover:underline underline-offset-4"
            >
              Topology
            </a>
            <a
              href="#pulse"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900 hover:underline underline-offset-4"
            >
              Full-Day Pulse
            </a>
            <a
              href="#gantt-feed"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900 hover:underline underline-offset-4"
            >
              Gantt Cards
            </a>
            <a
              href="#methodology"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900 hover:underline underline-offset-4"
            >
              Methodology
            </a>
          </nav>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0F2C3D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#163D54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00778B] sm:gap-2 sm:px-4 sm:py-2"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print / Save PDF
          </button>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-[1320px] space-y-5 px-4 py-6 sm:px-6 sm:py-7">
        {/* HERO SUMMARY HEADER */}
        <section className="rounded-xl bg-gradient-to-br from-[#0B2533] via-[#0F3A4D] to-[#12485C] px-6 py-7 text-white sm:px-8 sm:py-8">
          <p className="text-xs font-semibold tracking-wide text-sky-300">
            RTD-Denver Transfer Timing Analysis · Series #1: W Line × Route 17 × Ore Cart Tungsten
          </p>
          <h1
            className="mt-2 max-w-4xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-[32px]"
            style={{ textWrap: 'balance' }}
          >
            Oak vs. Federal Center vs. Jeffco Gov Center → 19th &amp; Illinois St (Golden)
          </h1>
          <p className="mt-2.5 max-w-4xl text-[14.5px] leading-relaxed text-slate-200">
            Hour-by-hour <strong className="font-semibold text-white">Branching Trunk Gantt</strong>{' '}
            comparing all three ways to reach Golden from the{' '}
            <strong className="font-semibold text-white">exact same Westbound W Line train</strong>
            —explicitly tracking Oak Station near-misses, Route 17’s Federal Center backtrack loop,
            W Line Federal Center short-turns, and equal-distance walks (~4 min) to the 19th &amp;
            Illinois common midpoint.
          </p>

          {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="mt-5 flex flex-col gap-1.5 border-t border-white/15 pt-4 text-xs text-slate-200 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5">
            <span>
              <strong className="font-semibold text-white">Common Midpoint:</strong> 19th St &amp;
              Illinois St, Golden
            </span>
            <span aria-hidden="true" className="hidden text-sky-300/60 sm:inline">
              ·
            </span>
            <span>
              <strong className="font-semibold text-white">Route 17 Stop:</strong> Washington Ave
              &amp; 19th St (4m / 0.20 mi walk)
            </span>
            <span aria-hidden="true" className="hidden text-sky-300/60 sm:inline">
              ·
            </span>
            <span>
              <strong className="font-semibold text-white">Ore Cart Timely Stop:</strong> Kafadar
              Commons (4m / 0.22 mi walk — 8m before CTLM Lot)
            </span>
            <span aria-hidden="true" className="hidden text-sky-300/60 sm:inline">
              ·
            </span>
            <span>
              <strong className="font-semibold text-white">Schedule Basis:</strong> RTD Fall 2026 +
              Mines Ore Cart Tungsten
            </span>
          </div>
        </section>

        {/* CORRIDOR TOPOLOGY SCHEMATIC */}
        <CorridorMap />

        {/* INTERACTIVE CONTROLS BAR (Wraps gracefully with zero right-edge overflow at any viewport) */}
        <section
          aria-label="Interactive Timetable Controls"
          className="no-print rounded-xl border border-slate-300/90 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md md:sticky md:top-2.5 md:z-30 sm:px-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-3">
            {/* Schedule Day */}
            <div className="flex max-w-full shrink-0 flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Schedule Day</span>
              <div
                role="group"
                aria-label="Schedule Day"
                className="inline-flex flex-nowrap rounded-lg border border-slate-200 bg-slate-100 p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={day === 'weekday'}
                  onClick={() => setDay('weekday')}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00778B] ${
                    day === 'weekday'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekday (Mon–Fri)
                </button>
                <button
                  type="button"
                  aria-pressed={day === 'weekend'}
                  onClick={() => setDay('weekend')}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00778B] ${
                    day === 'weekend'
                      ? 'bg-[#0F3A4D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekend (Sat &amp; Sun)
                </button>
              </div>
            </div>

            {/* Hour Display */}
            <div className="flex shrink-0 flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Hour Display</span>
              <div
                role="group"
                aria-label="Hour Display"
                className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-0.5 sm:flex-nowrap"
              >
                {(
                  [
                    ['hourly', 'Hour-by-Hour (Key Trips)'],
                    ['all', 'Every Single Train'],
                    ['traps', 'Short-Turns & Traps Only'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    aria-pressed={mode === val}
                    onClick={() => setMode(val)}
                    className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00778B] ${
                      mode === val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ore Cart Stop / Walk */}
            <div className="flex shrink-0 flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Ore Cart Stop / Walk
              </span>
              <div
                role="group"
                aria-label="Ore Cart Stop and Walk"
                className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-0.5 sm:flex-nowrap"
              >
                {(
                  [
                    ['both', 'Compare Both'],
                    ['kafadar', 'Kafadar + 4m Walk'],
                    ['ctlm', 'CTLM Lot + 1m Walk'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    aria-pressed={walkMode === val}
                    onClick={() => setWalkMode(val)}
                    className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00778B] ${
                      walkMode === val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* W Line Delay Simulator */}
            <div className="flex max-w-full min-w-0 shrink-0 flex-col gap-1">
              <label htmlFor="delaySlider" className="text-[11px] font-semibold text-slate-500">
                W Line Delay Simulator
              </label>
              <div className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                <input
                  id="delaySlider"
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  aria-valuetext={delayLabel}
                  className="h-5 w-20 min-w-0 shrink cursor-pointer accent-red-600"
                />
                <span
                  data-testid="delay-readout"
                  className={`min-w-[64px] shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-center font-mono text-[11.5px] font-bold tabular-nums ${delayToneClass}`}
                >
                  {delayLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* DYNAMIC 4-COLUMN KPI SUMMARY STRIP */}
        <section
          aria-label="Schedule Summary Metrics"
          data-testid="kpi-grid"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Westbound W Trains Analyzed</div>
            <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
              {stats.total}
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              <strong className="font-semibold text-slate-900">{stats.shortCount}</strong>{' '}
              short-turn at Fed Ctr ({stats.shortPct}%)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Oak W→17 Tight / Near-Miss</div>
            <div
              className={`mt-1 font-mono text-2xl font-extrabold tabular-nums tracking-tight ${
                stats.oakTightOrMiss > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {stats.oakTightOrMiss} / {stats.total}
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              ≤2m sprint or missed at +{delay}m delay
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Avg Time — Path A (Oak → 17)</div>
            <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums tracking-tight text-blue-700">
              {stats.avgA} min
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Fastest on {stats.winCounts.A} trains (incl. 4m walk)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">
              Avg Time — Path C (Tungsten)
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums tracking-tight text-amber-700">
              {stats.avgC !== null ? `${stats.avgC} min` : '—'}
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Available on {stats.oreActiveCount} trains (
              {day === 'weekday' ? '7:00a–6:18p' : '8:20a–4:50p'})
            </div>
          </div>
        </section>

        {/* FULL-DAY HOUR-BY-HOUR PULSE STRIP */}
        <HourPulseStrip
          hoursMap={hoursMap}
          day={day}
          delay={delay}
          visibleHours={visibleHours}
          onSelectHour={handleSelectHour}
        />

        {/* COMPACT LEGEND BAR */}
        <div
          aria-label="Chart Legend"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-[#00778B]" />
            Original W Line Train
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-red-600" />
            ⛔ Short-Turn Barrier (Ends Fed Ctr)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs border border-dashed border-sky-700 bg-sky-300" />
            2nd W Line Train (After Short-Turn)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-blue-700" />
            Route 17 Bus
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-slate-600" />
            Ore Cart Tungsten (to Kafadar)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-slate-400" />
            +8m Tungsten Loop (to CTLM)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-emerald-500" />
            Doable Wait (4–8m)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4.5 rounded-xs bg-amber-500" />
            Sprint / Tight (1–3m)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4.5 rounded-xs border border-red-600"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #fecaca, #fecaca 3px, #ef4444 3px, #ef4444 5px)',
              }}
            />
            0m / Near-Miss Penalty Extension
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-[3px] border-dotted border-emerald-600" />
            4m Walk to 19th &amp; Illinois
          </span>
        </div>

        {/* MAIN GANTT FEED */}
        <main id="gantt-feed" className="scroll-mt-24 space-y-7">
          {hourSections.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No trains match this filter at +{delay}m delay.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Switch Hour Display back to Hour-by-Hour or increase the W Line Delay slider to
                inspect tight near-misses.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0F2C3D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#163D54]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset Filters
              </button>
            </div>
          ) : (
            hourSections.map((sec) => (
              <section
                key={sec.hr}
                id={`hour-${sec.hr}`}
                aria-labelledby={`hour-heading-${sec.hr}`}
                className="scroll-mt-24 space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/90 pb-2">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3
                      id={`hour-heading-${sec.hr}`}
                      className="font-mono text-base font-extrabold tabular-nums text-slate-900"
                    >
                      {fmtHour(sec.hr)}
                    </h3>
                    <span className="text-sm font-medium text-slate-600">{sec.regimeLabel}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        sec.hasShort ? 'text-red-700' : 'text-[#00778B]'
                      }`}
                    >
                      {sec.hasShort
                        ? '⛔ Includes Fed Ctr Short-Turn'
                        : '✓ All Trains Thru to Jeffco'}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span
                      className={
                        sec.hasOre ? 'font-medium text-slate-700' : 'text-slate-400'
                      }
                    >
                      {sec.hasOre ? 'Ore Cart Active' : 'Ore Cart Closed'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {sec.shown.map(({ ev, repeats }) => (
                    <GanttCard
                      key={`${ev.train.oak}-${ev.train.short ? 's' : 't'}`}
                      ev={ev}
                      repeats={repeats}
                      day={day}
                      delay={delay}
                      walkMode={walkMode}
                      onHoverTip={setTooltip}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* METHODOLOGY & SCHEDULE NOTES */}
        <section
          id="methodology"
          aria-labelledby="methodology-heading"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="methodology-heading"
              className="text-[16px] font-bold tracking-tight text-slate-900"
            >
              Schedule Basis &amp; Transfer Assumptions
            </h2>
            <span className="text-xs text-slate-500">
              Compiled from RTD Fall 2026 timetables &amp; Colorado School of Mines Ore Cart
              schedules
            </span>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-slate-600">
            <li>
              <strong className="font-semibold text-slate-900">Same-Train Continuity:</strong>{' '}
              Every Gantt card anchors at{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                T+0
              </code>{' '}
              when a single Westbound W Line train arrives at Oak Station. That exact train either
              continues to Federal Center (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                +4–5m
              </code>
              ) and Jeffco Gov Center (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                +13–14m
              </code>
              ) or{' '}
              <strong className="font-semibold text-slate-900">
                short-turns at Federal Center
              </strong>{' '}
              (weekday evenings 6:34–8:04 PM; weekends every other train all day from 9:05 AM–8:36
              PM), forcing Jeffco-bound riders into a 15-minute rail platform wait.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Transfer Thresholds:</strong>{' '}
              Walking from the westbound W Line platform at Oak Station to Gate D takes ~1 minute.
              Connections with{' '}
              <strong className="font-semibold text-slate-900">1–3 min</strong> scheduled buffer
              are flagged{' '}
              <strong className="font-semibold text-amber-800">Sprint / Tight (amber)</strong> and
              show a dashed <em>&ldquo;If missed&rdquo;</em> penalty bar (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                +15m
              </code>{' '}
              weekday daytime;{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                +30m
              </code>{' '}
              weekday evenings &amp; weekends). Connections with{' '}
              <strong className="font-semibold text-slate-900">0 min</strong> buffer (such as
              weekday PM peak W Line arriving Jeffco at{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                :05/:20/:35/:50
              </code>{' '}
              vs. Ore Cart Tungsten departing at{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                :05/:20/:35/:50
              </code>
              ) are flagged as{' '}
              <strong className="font-semibold text-red-700">0m Hold?</strong> unless the shuttle
              holds for rail arrivals.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">
                Equal-Walk Midpoint Comparison:
              </strong>{' '}
              Route 17 Westbound stops at{' '}
              <strong className="font-semibold text-slate-900">Washington Ave &amp; 19th St</strong>{' '}
              (Stop #17149,{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                0.20 mi / ~4 min walk
              </code>{' '}
              west on 19th St to 19th &amp; Illinois). Ore Cart Tungsten reaches{' '}
              <strong className="font-semibold text-slate-900">
                Kafadar Commons (16th &amp; Illinois)
              </strong>{' '}
              first (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                0.22 mi / ~4 min walk
              </code>{' '}
              south down Illinois St to 19th &amp; Illinois), arriving{' '}
              <strong className="font-semibold text-slate-900">8 minutes earlier</strong> than the
              shuttle’s clockwise loop to{' '}
              <strong className="font-semibold text-slate-900">CTLM Lot</strong> (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                0.05 mi / ~1 min walk
              </code>
              )—making Kafadar + walk{' '}
              <strong className="font-semibold text-slate-900">5 net minutes faster</strong> (and
              available on the last evening shuttles that terminate at Kafadar).
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Delay Simulator Tip:</strong> Slide
              the <strong className="font-semibold text-slate-900">W Line Delay Simulator</strong>{' '}
              to{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800">
                +2 min
              </code>{' '}
              to see how even a minor light rail delay transforms Oak Station’s 1–2 minute daytime
              transfers into 15-to-30 minute near-misses, flipping the winning route across entire
              blocks of the day.
            </li>
          </ul>
        </section>

        {/* QUIET FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 pb-6 text-xs text-slate-500">
          <span>
            RTD Golden Transfer Atlas · Series #1 (W Line × Route 17 × Ore Cart Tungsten) ·{' '}
            {evaluated.length} trains evaluated
          </span>
          <a href="#top" className="font-medium text-slate-600 hover:text-slate-900 hover:underline">
            Back to top
          </a>
        </footer>
      </div>

      <TooltipOverlay tooltip={tooltip} />
    </div>
  );
}
