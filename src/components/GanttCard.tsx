import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import {
  ScheduleDay,
  TrainEvaluation,
  WalkMode,
  buildTakeawayParts,
  fmtShort,
  fmtTime,
} from '../utils/transitSchedule';
import { BranchingGanttSvg } from './BranchingGanttSvg';
import { TooltipData } from './TooltipOverlay';

interface GanttCardProps {
  ev: TrainEvaluation;
  repeats: TrainEvaluation[];
  day: ScheduleDay;
  delay: number;
  walkMode: WalkMode;
  onHoverTip: (tip: TooltipData | null) => void;
}

export const GanttCard: React.FC<GanttCardProps> = ({
  ev,
  repeats,
  day,
  delay,
  walkMode,
  onHoverTip,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const repeatStr =
    repeats.length > 1
      ? `Repeats ${repeats.length}× this hour (${repeats.map((r) => fmtShort(r.train.oak)).join(', ')})`
      : `Single pattern (${fmtTime(ev.train.oak)} Oak)`;

  const winnerLabel =
    ev.winners.length > 1
      ? `Tie: ${ev.winners
          .map((w) => (w === 'A' ? 'Oak→17' : w === 'B' ? 'Fed→17' : 'Tungsten'))
          .join(' = ')} (${ev.minDur}m)`
      : ev.winners[0] === 'A'
        ? `Fastest: Oak → 17 (${ev.minDur}m)`
        : ev.winners[0] === 'B'
          ? `Fastest: Fed Ctr → 17 (${ev.minDur}m)`
          : `Fastest: Jeffco → Tungsten (${ev.minDur}m)`;

  const winnerToneClass =
    ev.winners.length > 1
      ? 'text-emerald-800'
      : ev.winners[0] === 'A'
        ? 'text-blue-800'
        : ev.winners[0] === 'B'
          ? 'text-indigo-800'
          : 'text-amber-800';

  const takeaway = buildTakeawayParts(ev, delay);

  const handleExportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const serialized = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = svg.getAttribute('data-export-name') || 'rtd-gantt';
    a.download = `${baseName}-${day}-d${delay}.svg`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <article
      data-testid="gantt-card"
      className={`print-card overflow-hidden rounded-xl border bg-white transition-colors duration-150 hover:border-slate-300 ${
        ev.train.short ? 'border-red-200/90' : 'border-slate-200'
      }`}
    >
      {/* Card Top Bar — Clean unboxed metadata with hairline bottom divider */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
          ev.train.short
            ? 'border-red-100 bg-red-50/40'
            : 'border-slate-100 bg-slate-50/60'
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h4 className="font-mono text-[14.5px] font-bold tabular-nums text-slate-900">
            W Train: {fmtTime(ev.train.oak)} Oak
          </h4>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={`text-xs font-semibold ${
              ev.train.short ? 'text-red-700' : 'text-[#00778B]'
            }`}
          >
            {ev.train.short ? '⛔ Short-Turn Fed Ctr' : '✓ Thru to Jeffco'}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-mono text-xs tabular-nums text-slate-500">{repeatStr}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className={`font-mono text-xs font-bold tabular-nums ${winnerToneClass}`}>
            ★ {winnerLabel}
          </span>
          <button
            type="button"
            onClick={handleExportSvg}
            aria-label={`Export SVG for ${fmtTime(ev.train.oak)} W Line train`}
            className="no-print inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00778B]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export SVG
          </button>
        </div>
      </div>

      {/* SVG Gantt Plot */}
      <div className="w-full overflow-x-auto px-3 pt-2 pb-3 sm:px-4">
        <BranchingGanttSvg
          ev={ev}
          walkMode={walkMode}
          svgRef={svgRef}
          onHoverTip={onHoverTip}
        />
      </div>

      {/* Editorial Footnote */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-dashed border-slate-200 bg-slate-50/40 px-4 py-2.5 text-xs text-slate-600 sm:px-5">
        <p className="max-w-3xl leading-relaxed">
          <strong className="font-semibold text-slate-900">{takeaway.heading}</strong>{' '}
          {takeaway.body}
        </p>
        <span className="whitespace-nowrap text-[11.5px] text-slate-500">
          Walks normalized to <strong className="font-semibold text-slate-700">19th &amp; Illinois</strong>{' '}
          (Wash &amp; 19th: 4m · Kafadar: 4m)
        </span>
      </div>
    </article>
  );
};
