import React from 'react';

export interface TooltipData {
  title: string;
  lines: string[];
  note?: string;
  noteTone?: 'warn' | 'danger' | 'info';
  x: number;
  y: number;
}

interface TooltipOverlayProps {
  tooltip: TooltipData | null;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({ tooltip }) => {
  if (!tooltip) return null;

  const pad = 14;
  const maxWidth = 330;
  const estHeight = 128;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 900;

  let left = tooltip.x + pad;
  let top = tooltip.y + pad;
  if (left + maxWidth > viewportW - 8) left = Math.max(8, tooltip.x - maxWidth - pad);
  if (top + estHeight > viewportH - 8) top = Math.max(8, tooltip.y - estHeight - pad);

  const noteColor =
    tooltip.noteTone === 'danger'
      ? 'text-red-300'
      : tooltip.noteTone === 'warn'
        ? 'text-amber-300'
        : 'text-sky-200';

  return (
    <div
      role="tooltip"
      className="no-print pointer-events-none fixed z-50 max-w-[330px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-slate-100 shadow-xl"
      style={{ left, top }}
    >
      <div className="mb-1 font-semibold text-sky-300">{tooltip.title}</div>
      <div className="space-y-0.5 font-mono text-[11px] tabular-nums text-slate-200">
        {tooltip.lines.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
      {tooltip.note && (
        <div className={`mt-1.5 border-t border-slate-700/80 pt-1 text-[11.5px] ${noteColor}`}>
          {tooltip.note}
        </div>
      )}
    </div>
  );
};
