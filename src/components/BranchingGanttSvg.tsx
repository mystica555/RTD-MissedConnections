import React from 'react';
import {
  TrainEvaluation,
  TransferStatus,
  WalkMode,
  fmtShort,
  fmtTime,
} from '../utils/transitSchedule';
import { TooltipData } from './TooltipOverlay';

interface BranchingGanttSvgProps {
  ev: TrainEvaluation;
  walkMode: WalkMode;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onHoverTip: (tip: TooltipData | null) => void;
}

const W = 1120;
const LEFT = 198;
const RIGHT = 166;
const PLOT_W = W - LEFT - RIGHT;
const MAX_MIN = 75;

function xOf(relMin: number): number {
  return LEFT + (Math.max(0, Math.min(MAX_MIN, relMin)) / MAX_MIN) * PLOT_W;
}

function wOf(mins: number): number {
  return Math.max(2, (mins / MAX_MIN) * PLOT_W);
}

function waitColor(st: TransferStatus): string {
  if (st === 'missed' || st === 'zero') return '#ef4444';
  if (st === 'sprint' || st === 'tight') return '#f59e0b';
  if (st === 'ok') return '#10b981';
  return '#cbd5e1';
}

function waitTextColor(st: TransferStatus): string {
  if (st === 'missed' || st === 'zero') return '#991b1b';
  if (st === 'sprint' || st === 'tight') return '#92400e';
  if (st === 'ok') return '#065f46';
  return '#475569';
}

export const BranchingGanttSvg: React.FC<BranchingGanttSvgProps> = ({
  ev,
  walkMode,
  svgRef,
  onHoverTip,
}) => {
  const hasMissExtA = ev.A.missArr !== null;
  const hasMissExtC = ev.C.available && ev.C.missArrC !== null;
  const showBothWalkC = ev.C.available && walkMode === 'both' && ev.C.arrCtlmWalk !== null;

  const yAxis = 22;
  const yTrunk = 48;
  const yA = 96;
  const yASub = hasMissExtA ? 120 : yA;
  const yB = hasMissExtA ? 152 : 136;
  const yC = yB + 44;
  const extraC = (showBothWalkC ? 22 : 0) + (hasMissExtC ? 22 : 0);
  const H = yC + 36 + extraC;

  const uid = `g_${ev.train.oak}_${ev.train.short ? 's' : 't'}_${ev.delayMin}_${walkMode}`;
  const baseT = ev.oakAct;
  const rel = (absT: number) => absT - baseT;

  const showTip = (
    e: React.MouseEvent<SVGGElement>,
    payload: Omit<TooltipData, 'x' | 'y'>
  ) => {
    onHoverTip({ ...payload, x: e.clientX, y: e.clientY });
  };

  const hideTip = () => onHoverTip(null);

  const gridTicks: number[] = [];
  for (let m = 0; m <= MAX_MIN; m += 5) gridTicks.push(m);

  const fedRel = rel(ev.fedAct);
  const jeffRel =
    ev.train.short || ev.train.jeff === null ? fedRel : rel(ev.train.jeff + ev.delayMin);

  // Path A coords
  const winA = ev.winners.includes('A');
  const aWaitStart = 0;
  const aBusStart = rel(ev.A.r17.oak);
  const aBusEnd = rel(ev.A.r17.wash);
  const aWalkEnd = rel(ev.A.arr);

  // Path B coords
  const winB = ev.winners.includes('B');
  const bWaitStart = fedRel;
  const bBusStart = rel(ev.B.r17.fed);
  const bOakPass = rel(ev.B.r17.oak);
  const bBusEnd = rel(ev.B.r17.wash);
  const bWalkEnd = rel(ev.B.arr);

  // Path C
  const winC = ev.winners.includes('C');

  const exportName = `rtd-gantt-${fmtShort(ev.train.oak).replace(':', '')}`;

  const trunkPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Westbound W Line Train',
    lines: [
      `Oak: ${fmtTime(ev.oakAct)} → Fed Ctr: ${fmtTime(ev.fedAct)}${
        ev.train.short
          ? ' (TERMINATES)'
          : ` → Jeffco: ${fmtTime((ev.train.jeff ?? ev.fedAct) + ev.delayMin)}`
      }`,
    ],
    note:
      ev.delayMin > 0
        ? `Includes +${ev.delayMin}m simulated W Line delay`
        : ev.train.short
          ? 'Short-turn train terminates at Federal Center'
          : 'Through train continues to Jeffco Gov Center',
    noteTone: ev.train.short ? 'danger' : 'info',
  };

  const aWaitPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Path A — Oak Station Transfer',
    lines: [
      `W arrives Oak: ${fmtTime(ev.oakAct)}`,
      `Bus 17 departs Gate D: ${fmtTime(ev.A.r17.oak)} (+${ev.A.wait}m)`,
    ],
    note: ev.A.missedRecent
      ? `Missed prior Bus 17 by ${ev.A.missedBy}m`
      : ev.A.risky
        ? `Tight +${ev.A.wait}m sprint — vulnerable to any rail delay`
        : undefined,
    noteTone: ev.A.missedRecent ? 'danger' : 'warn',
  };

  const aBusPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Route 17 Westbound (from Oak Gate D)',
    lines: [
      `Lv Oak Gate D: ${fmtTime(ev.A.r17.oak)}`,
      `Ar Wash Ave & 19th: ${fmtTime(ev.A.r17.wash)} (${ev.A.r17.wash - ev.A.r17.oak}m ride)`,
    ],
  };

  const aWalkPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Walk: Wash Ave & 19th → 19th & Illinois',
    lines: [`${fmtTime(ev.A.r17.wash)} → ${fmtTime(ev.A.arr)} (4 min · 0.20 mi west on 19th St)`],
  };

  const bWaitPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Path B — Federal Center Gate D Transfer',
    lines: [
      `W arrives Fed Ctr: ${fmtTime(ev.fedAct)}`,
      `Bus 17 departs Gate D: ${fmtTime(ev.B.r17.fed)} (+${ev.B.wait}m)`,
    ],
    note: ev.B.sameBusAsA
      ? 'Boards the exact same Bus 17 as Path A — at its sheltered terminus'
      : undefined,
    noteTone: 'info',
  };

  const bBusPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Route 17 Westbound (from Federal Center Gate D)',
    lines: [
      `Lv Fed Ctr: ${fmtTime(ev.B.r17.fed)} → Passes Oak: ${fmtTime(ev.B.r17.oak)} (+${ev.B.r17.oak - ev.B.r17.fed}m backtrack)`,
      `Ar Wash Ave & 19th: ${fmtTime(ev.B.r17.wash)}`,
    ],
  };

  const bWalkPayload: Omit<TooltipData, 'x' | 'y'> = {
    title: 'Walk: Wash Ave & 19th → 19th & Illinois',
    lines: [`${fmtTime(ev.B.r17.wash)} → ${fmtTime(ev.B.arr)} (4 min · 0.20 mi)`],
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      data-export-name={exportName}
      role="img"
      aria-label={`Branching Trunk Gantt for ${fmtTime(ev.train.oak)} W Line train comparing Oak to Route 17, Federal Center to Route 17, and Jeffco to Ore Cart Tungsten`}
      className="block h-auto w-full min-w-[820px]"
    >
      <defs>
        <pattern
          id={`hatchRed_${uid}`}
          width="6"
          height="6"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="6" height="6" fill="#fee2e2" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="2.5" />
        </pattern>
        <pattern
          id={`hatchTeal_${uid}`}
          width="7"
          height="7"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="7" height="7" fill="#bae6fd" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#0284c7" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* Gridlines every 5m, labeled every 10m */}
      {gridTicks.map((m) => {
        const gx = xOf(m);
        const major = m % 10 === 0;
        return (
          <g key={m}>
            <line
              x1={gx}
              y1={yAxis + 6}
              x2={gx}
              y2={H - 12}
              stroke={major ? '#e2e8f0' : '#f1f5f9'}
              strokeWidth={major ? 1.2 : 1}
            />
            {major && (
              <text
                x={gx}
                y={yAxis}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                fill="#64748b"
              >
                +{m}m
              </text>
            )}
          </g>
        );
      })}

      {/* ROW 0: SHARED W LINE TRUNK */}
      <text
        x="12"
        y={yTrunk - 2}
        fontSize="11.5"
        fontWeight="800"
        fill={ev.train.short ? '#dc2626' : '#00778b'}
      >
        SAME W TRAIN
      </text>
      <text x="12" y={yTrunk + 12} fontSize="10" fill="#64748b">
        {ev.train.short ? '⛔ Terminates Fed Ctr' : '✓ Thru to Jeffco'}
      </text>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, trunkPayload)}
        onMouseMove={(e) => showTip(e, trunkPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(0)}
          y={yTrunk - 7}
          width={wOf(jeffRel)}
          height="14"
          rx="7"
          fill="#00778b"
        />
        <circle cx={xOf(0)} cy={yTrunk} r="6" fill="#fff" stroke="#00778b" strokeWidth="3.2" />
        <text
          x={xOf(0) - 4}
          y={yTrunk - 12}
          textAnchor="end"
          fontSize="9.5"
          fontWeight="800"
          fill="#0f172a"
        >
          Oak {fmtShort(ev.oakAct)}
        </text>

        <circle
          cx={xOf(fedRel)}
          cy={yTrunk}
          r="6"
          fill={ev.train.short ? '#dc2626' : '#fff'}
          stroke={ev.train.short ? '#991b1b' : '#00778b'}
          strokeWidth="3"
        />
        <text
          x={xOf(fedRel) + 4}
          y={yTrunk - 12}
          textAnchor="start"
          fontSize="9.5"
          fontWeight="800"
          fill={ev.train.short ? '#dc2626' : '#0f172a'}
        >
          Fed {fmtShort(ev.fedAct)}
        </text>

        {ev.train.short ? (
          <>
            <line
              x1={xOf(fedRel) + 7}
              y1={yTrunk - 11}
              x2={xOf(fedRel) + 7}
              y2={yTrunk + 11}
              stroke="#dc2626"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <rect
              x={xOf(fedRel) + 14}
              y={yTrunk - 10}
              width="148"
              height="20"
              rx="4"
              fill="#fef2f2"
              stroke="#fca5a5"
            />
            <text
              x={xOf(fedRel) + 88}
              y={yTrunk + 3.5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#991b1b"
            >
              ⛔ ENDS AT FED CTR
            </text>
          </>
        ) : (
          <>
            <circle
              cx={xOf(jeffRel)}
              cy={yTrunk}
              r="6"
              fill="#fff"
              stroke="#00778b"
              strokeWidth="3.2"
            />
            <text
              x={xOf(jeffRel) + 12}
              y={yTrunk - 12}
              textAnchor="start"
              fontSize="9.5"
              fontWeight="800"
              fill="#0f172a"
            >
              Jeffco {fmtShort((ev.train.jeff ?? ev.fedAct) + ev.delayMin)}
            </text>
          </>
        )}
      </g>

      {/* Vertical drop-off stems */}
      <line
        x1={xOf(0)}
        y1={yTrunk + 7}
        x2={xOf(0)}
        y2={yA}
        stroke="#1d4ed8"
        strokeWidth="2"
        strokeDasharray="3 2"
        opacity="0.7"
      />
      <line
        x1={xOf(fedRel)}
        y1={yTrunk + 7}
        x2={xOf(fedRel)}
        y2={ev.train.short ? yC : yB}
        stroke={ev.train.short ? '#dc2626' : '#1d4ed8'}
        strokeWidth="2"
        strokeDasharray="3 2"
        opacity="0.6"
      />
      {!ev.train.short && (
        <line
          x1={xOf(jeffRel)}
          y1={yTrunk + 7}
          x2={xOf(jeffRel)}
          y2={yC}
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="3 2"
          opacity="0.7"
        />
      )}

      {/* ROW A: OAK -> ROUTE 17 -> WASH & 19TH -> WALK 4M */}
      <text x="12" y={yA - 1} fontSize="11.5" fontWeight="800" fill="#1e3a8a">
        A) Oak → Bus 17
      </text>
      <text x="12" y={yA + 12} fontSize="10" fill="#64748b">
        Wash &amp; 19th + 4m walk
      </text>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, aWaitPayload)}
        onMouseMove={(e) => showTip(e, aWaitPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(aWaitStart)}
          y={yA - 9}
          width={wOf(aBusStart - aWaitStart)}
          height="18"
          rx="3"
          fill={ev.A.missedRecent ? `url(#hatchRed_${uid})` : waitColor(ev.A.status)}
          stroke={ev.A.missedRecent ? '#dc2626' : 'none'}
        />
        {ev.A.wait >= 5 && (
          <text
            x={xOf((aWaitStart + aBusStart) / 2)}
            y={yA + 3.5}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fill={waitTextColor(ev.A.status)}
          >
            {ev.A.missedRecent ? `✗-${ev.A.missedBy}m` : `+${ev.A.wait}m`}
          </text>
        )}
      </g>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, aBusPayload)}
        onMouseMove={(e) => showTip(e, aBusPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(aBusStart)}
          y={yA - 9}
          width={wOf(aBusEnd - aBusStart)}
          height="18"
          rx="4"
          fill="#1d4ed8"
        />
        <text
          x={xOf((aBusStart + aBusEnd) / 2)}
          y={yA + 3.5}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#fff"
        >
          17 ({fmtShort(ev.A.r17.oak)}→{fmtShort(ev.A.r17.wash)})
        </text>
      </g>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, aWalkPayload)}
        onMouseMove={(e) => showTip(e, aWalkPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(aBusEnd)}
          y={yA - 7}
          width={wOf(aWalkEnd - aBusEnd)}
          height="14"
          rx="3"
          fill="#d1fae5"
          stroke="#059669"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <text
          x={xOf((aBusEnd + aWalkEnd) / 2)}
          y={yA + 3}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#065f46"
        >
          4m
        </text>
      </g>

      {ev.A.wait < 5 && (
        <>
          <rect
            x={xOf(aWalkEnd) + 6}
            y={yA - 9}
            width="54"
            height="18"
            rx="4"
            fill={ev.A.wait <= 2 ? '#fef3c7' : '#ecfdf5'}
            stroke={ev.A.wait <= 2 ? '#f59e0b' : '#10b981'}
          />
          <text
            x={xOf(aWalkEnd) + 33}
            y={yA + 3.5}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fill={ev.A.wait <= 2 ? '#92400e' : '#065f46'}
          >
            {ev.A.wait <= 2 ? `! +${ev.A.wait}m` : `+${ev.A.wait}m`}
          </text>
        </>
      )}

      <text
        x={W - RIGHT + 10}
        y={yA + 1}
        fontFamily="JetBrains Mono, monospace"
        fontSize="11.5"
        fontWeight="800"
        fill={winA ? '#1d4ed8' : '#0f172a'}
      >
        {fmtTime(ev.A.arr)} ({ev.A.dur}m)
      </text>
      {winA ? (
        <text x={W - RIGHT + 10} y={yA + 13} fontSize="9.5" fontWeight="800" fill="#1d4ed8">
          ★ FASTEST{ev.A.risky ? ' (RISKY)' : ''}
        </text>
      ) : ev.A.missedRecent ? (
        <text x={W - RIGHT + 10} y={yA + 13} fontSize="9.5" fontWeight="800" fill="#dc2626">
          ✗ MISSED BY {ev.A.missedBy}m
        </text>
      ) : null}

      {/* Ghosted "If Missed at Oak" penalty extension */}
      {hasMissExtA && ev.A.nextR17 && ev.A.missArr !== null && (() => {
        const mBusStart = rel(ev.A.nextR17.oak);
        const mEnd = rel(ev.A.missArr);
        const penalty = ev.A.missArr - ev.A.arr;
        const missAPayload: Omit<TooltipData, 'x' | 'y'> = {
          title: `If you miss the ${fmtTime(ev.A.r17.oak)} Bus 17 at Oak (+${ev.A.wait}m sprint)`,
          lines: [
            `Wait +${mBusStart}m for ${fmtTime(ev.A.nextR17.oak)} bus`,
            `Arrive 19th & Illinois: ${fmtTime(ev.A.missArr)} (${mEnd}m total, +${penalty}m penalty)`,
          ],
          noteTone: 'danger',
        };
        return (
          <g
            className="svg-seg"
            onMouseEnter={(e) => showTip(e, missAPayload)}
            onMouseMove={(e) => showTip(e, missAPayload)}
            onMouseLeave={hideTip}
          >
            <path
              d={`M ${xOf(aBusStart)} ${yA + 9} L ${xOf(aBusStart)} ${yASub} L ${xOf(mBusStart)} ${yASub}`}
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            <rect
              x={xOf(aBusStart)}
              y={yASub - 6}
              width={wOf(mBusStart - aBusStart)}
              height="12"
              rx="2"
              fill={`url(#hatchRed_${uid})`}
              stroke="#ef4444"
              strokeWidth="1"
              opacity="0.9"
            />
            <rect
              x={xOf(mBusStart)}
              y={yASub - 6}
              width={wOf(mEnd - mBusStart)}
              height="12"
              rx="3"
              fill="#93c5fd"
              opacity="0.55"
              stroke="#3b82f6"
              strokeDasharray="3 2"
            />
            {xOf(mEnd) + 175 <= W - 8 ? (
              <text
                x={xOf(mEnd) + 6}
                y={yASub + 3.5}
                fontSize="9.5"
                fontWeight="700"
                fill="#b91c1c"
              >
                If missed: {fmtShort(ev.A.missArr)} ({mEnd}m, +{penalty}m)
              </text>
            ) : (
              <text
                x={xOf(aBusStart) - 6}
                y={yASub + 3.5}
                textAnchor="end"
                fontSize="9.5"
                fontWeight="700"
                fill="#b91c1c"
              >
                If missed: {fmtShort(ev.A.missArr)} (+{penalty}m)
              </text>
            )}
          </g>
        );
      })()}

      {/* ROW B: FED CENTER -> ROUTE 17 -> WALK 4M */}
      <text x="12" y={yB - 1} fontSize="11.5" fontWeight="800" fill="#3730a3">
        B) Fed Ctr → Bus 17
      </text>
      <text x="12" y={yB + 12} fontSize="10" fill="#64748b">
        Backtracks Oak + 4m walk
      </text>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, bWaitPayload)}
        onMouseMove={(e) => showTip(e, bWaitPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(bWaitStart)}
          y={yB - 9}
          width={wOf(bBusStart - bWaitStart)}
          height="18"
          rx="3"
          fill={ev.B.missedRecent ? `url(#hatchRed_${uid})` : waitColor(ev.B.status)}
        />
        {ev.B.wait >= 4 && (
          <text
            x={xOf((bWaitStart + bBusStart) / 2)}
            y={yB + 3.5}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fill={waitTextColor(ev.B.status)}
          >
            +{ev.B.wait}m
          </text>
        )}
      </g>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, bBusPayload)}
        onMouseMove={(e) => showTip(e, bBusPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(bBusStart)}
          y={yB - 9}
          width={wOf(bOakPass - bBusStart)}
          height="18"
          rx="3"
          fill="#60a5fa"
        />
        <text
          x={xOf((bBusStart + bOakPass) / 2)}
          y={yB + 3}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#fff"
        >
          →Oak
        </text>
        <rect
          x={xOf(bOakPass)}
          y={yB - 9}
          width={wOf(bBusEnd - bOakPass)}
          height="18"
          rx="4"
          fill="#1d4ed8"
        />
        <text
          x={xOf((bOakPass + bBusEnd) / 2)}
          y={yB + 3.5}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#fff"
        >
          17 ({fmtShort(ev.B.r17.oak)}→{fmtShort(ev.B.r17.wash)})
        </text>
      </g>

      <g
        className="svg-seg"
        onMouseEnter={(e) => showTip(e, bWalkPayload)}
        onMouseMove={(e) => showTip(e, bWalkPayload)}
        onMouseLeave={hideTip}
      >
        <rect
          x={xOf(bBusEnd)}
          y={yB - 7}
          width={wOf(bWalkEnd - bBusEnd)}
          height="14"
          rx="3"
          fill="#d1fae5"
          stroke="#059669"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <text
          x={xOf((bBusEnd + bWalkEnd) / 2)}
          y={yB + 3}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#065f46"
        >
          4m
        </text>
      </g>

      <text
        x={W - RIGHT + 10}
        y={yB + 1}
        fontFamily="JetBrains Mono, monospace"
        fontSize="11.5"
        fontWeight="800"
        fill={winB ? '#4338ca' : '#0f172a'}
      >
        {fmtTime(ev.B.arr)} ({ev.B.dur}m)
      </text>
      {winB && ev.B.sameBusAsA ? (
        <text x={W - RIGHT + 10} y={yB + 13} fontSize="9.5" fontWeight="800" fill="#065f46">
          ★ TIE (SAME BUS, SAFER)
        </text>
      ) : winB ? (
        <text x={W - RIGHT + 10} y={yB + 13} fontSize="9.5" fontWeight="800" fill="#4338ca">
          ★ FASTEST
        </text>
      ) : ev.B.sameBusAsA ? (
        <text x={W - RIGHT + 10} y={yB + 13} fontSize="9.5" fontWeight="700" fill="#64748b">
          Same bus as Path A
        </text>
      ) : null}

      {/* ROW C: JEFFCO -> ORE CART TUNGSTEN */}
      <text x="12" y={yC - 1} fontSize="11.5" fontWeight="800" fill="#334155">
        C) Jeffco → Tungsten
      </text>
      <text x="12" y={yC + 12} fontSize="10" fill="#64748b">
        {walkMode === 'ctlm' ? 'CTLM Lot + 1m walk' : 'Kafadar + 4m walk'}
      </text>

      {!ev.C.available ? (
        <>
          {ev.train.short && ev.C.nextW && ev.C.jeffAct !== null ? (
            (() => {
              const w2Start = rel(ev.C.nextW.fed + ev.delayMin);
              const w2End = rel(ev.C.jeffAct);
              return (
                <>
                  <rect
                    x={xOf(fedRel)}
                    y={yC - 9}
                    width={wOf(w2Start - fedRel)}
                    height="18"
                    rx="3"
                    fill={`url(#hatchRed_${uid})`}
                    stroke="#ef4444"
                  />
                  <text
                    x={xOf((fedRel + w2Start) / 2)}
                    y={yC + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill="#991b1b"
                  >
                    +{ev.C.railWaitFed}m W Wait
                  </text>
                  <rect
                    x={xOf(w2Start)}
                    y={yC - 9}
                    width={wOf(w2End - w2Start)}
                    height="18"
                    rx="4"
                    fill={`url(#hatchTeal_${uid})`}
                    stroke="#0284c7"
                  />
                  <text
                    x={xOf((w2Start + w2End) / 2)}
                    y={yC + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill="#0369a1"
                  >
                    2nd W
                  </text>
                  <rect
                    x={xOf(w2End) + 6}
                    y={yC - 9}
                    width={Math.max(180, xOf(MAX_MIN) - xOf(w2End) - 10)}
                    height="18"
                    rx="4"
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={xOf(w2End) + 14}
                    y={yC + 3.5}
                    fontSize="10"
                    fontWeight="700"
                    fill="#64748b"
                  >
                    {ev.C.reason}
                  </text>
                </>
              );
            })()
          ) : (
            <>
              <rect
                x={xOf(jeffRel)}
                y={yC - 9}
                width={Math.max(220, xOf(MAX_MIN) - xOf(jeffRel))}
                height="18"
                rx="4"
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeDasharray="4 3"
              />
              <text
                x={xOf(jeffRel) + 10}
                y={yC + 3.5}
                fontSize="10"
                fontWeight="700"
                fill="#64748b"
              >
                {ev.C.reason}
              </text>
            </>
          )}
          <text
            x={W - RIGHT + 10}
            y={yC + 3}
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
            fontWeight="700"
            fill="#94a3b8"
          >
            NO SERVICE
          </text>
        </>
      ) : (
        (() => {
          const c = ev.C;
          const cJeffRel = rel(c.jeffAct);
          const cTungStart = rel(c.tung.jeff);
          const cKafEnd = rel(c.tung.kaf);
          const cKafWalkEnd = rel(c.arrKafWalk);
          const cCtlmEnd = c.tung.ctlm !== null ? rel(c.tung.ctlm) : null;
          const cCtlmWalkEnd = c.arrCtlmWalk !== null ? rel(c.arrCtlmWalk) : null;
          const primaryEndRel =
            walkMode === 'ctlm' && cCtlmWalkEnd !== null ? cCtlmWalkEnd : cKafWalkEnd;

          const stPayload: Omit<TooltipData, 'x' | 'y'> | null =
            ev.train.short && c.nextW
              ? {
                  title: 'Short-Turn Penalty at Federal Center',
                  lines: [
                    `Your W train ends at Fed Ctr ${fmtTime(ev.fedAct)}`,
                    `Wait +${c.railWaitFed}m for next W (${fmtTime(c.nextW.fed + ev.delayMin)}) → Ar Jeffco ${fmtTime(c.jeffAct)}`,
                  ],
                  noteTone: 'danger',
                }
              : null;

          const cWaitPayload: Omit<TooltipData, 'x' | 'y'> = {
            title: 'Path C — Jeffco Gov Center → Ore Cart Tungsten',
            lines: [
              `W arrives Jeffco: ${fmtTime(c.jeffAct)}`,
              `Tungsten departs: ${fmtTime(c.tung.jeff)} (+${c.waitC}m)`,
            ],
            note: c.zeroHoldRisk
              ? '0-minute scheduled gap! Must hold for train or wait +15m.'
              : c.missedRecentC
                ? `Missed prior Tungsten by ${c.missedByC}m`
                : undefined,
            noteTone: 'danger',
          };

          const ctPayload: Omit<TooltipData, 'x' | 'y'> = {
            title: 'Ore Cart Tungsten (Full Loop to CTLM Lot)',
            lines: [
              `Lv Jeffco: ${fmtTime(c.tung.jeff)} → Kafadar: ${fmtTime(c.tung.kaf)} → CTLM: ${c.tung.ctlm !== null ? fmtTime(c.tung.ctlm) : '—'}`,
              `Walk 1m to 19th & Illinois: ${c.arrCtlmWalk !== null ? fmtTime(c.arrCtlmWalk) : '—'}`,
            ],
          };

          const kPayload: Omit<TooltipData, 'x' | 'y'> = {
            title: 'Ore Cart Tungsten → Kafadar Commons (Timely Stop)',
            lines: [
              `Lv Jeffco: ${fmtTime(c.tung.jeff)} → Ar Kafadar (16th & Ill): ${fmtTime(c.tung.kaf)} (${c.tung.kaf - c.tung.jeff}m ride)`,
            ],
          };

          const kwPayload: Omit<TooltipData, 'x' | 'y'> = {
            title: 'Walk: Kafadar Commons → 19th & Illinois',
            lines: [
              `${fmtTime(c.tung.kaf)} → ${fmtTime(c.arrKafWalk)} (4 min · 0.22 mi south on Illinois St)`,
            ],
          };

          let nextSubY = yC + 22;
          const subRows: React.ReactNode[] = [];

          if (showBothWalkC && cCtlmEnd !== null && cCtlmWalkEnd !== null && c.arrCtlmWalk !== null) {
            const subY = nextSubY;
            const ctCompPayload: Omit<TooltipData, 'x' | 'y'> = {
              title: 'Walk Comparison — Stay on Tungsten to CTLM Lot',
              lines: [
                `Kafadar ${fmtTime(c.tung.kaf)} + 8m loop → CTLM ${fmtTime(c.tung.ctlm!)} + 1m walk = ${fmtTime(c.arrCtlmWalk)} (${c.arrCtlmWalk - baseT}m total)`,
              ],
              note: '5 minutes slower than getting off at Kafadar & walking 4m',
              noteTone: 'info',
            };
            subRows.push(
              <g
                key="ctlm-comp"
                className="svg-seg"
                onMouseEnter={(e) => showTip(e, ctCompPayload)}
                onMouseMove={(e) => showTip(e, ctCompPayload)}
                onMouseLeave={hideTip}
              >
                <path
                  d={`M ${xOf(cKafEnd)} ${yC + 9} L ${xOf(cKafEnd)} ${subY} L ${xOf(cCtlmEnd)} ${subY}`}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                <rect
                  x={xOf(cKafEnd)}
                  y={subY - 5.5}
                  width={wOf(cCtlmEnd - cKafEnd)}
                  height="11"
                  rx="2.5"
                  fill="#94a3b8"
                />
                <rect
                  x={xOf(cCtlmEnd)}
                  y={subY - 5.5}
                  width={wOf(cCtlmWalkEnd - cCtlmEnd)}
                  height="11"
                  rx="2"
                  fill="#d1fae5"
                  stroke="#059669"
                  strokeWidth="1"
                />
                {xOf(cCtlmWalkEnd) + 275 <= W - 8 ? (
                  <text
                    x={xOf(cCtlmWalkEnd) + 6}
                    y={subY + 3.5}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#475569"
                  >
                    Stay to CTLM (+8m loop, 1m walk): {fmtShort(c.arrCtlmWalk)} (
                    {c.arrCtlmWalk - baseT}m, +5m slower)
                  </text>
                ) : (
                  <text
                    x={xOf(cKafEnd) - 8}
                    y={subY + 3.5}
                    textAnchor="end"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#475569"
                  >
                    Stay to CTLM (+8m loop, 1m walk): {fmtShort(c.arrCtlmWalk)} (
                    {c.arrCtlmWalk - baseT}m, +5m slower)
                  </text>
                )}
              </g>
            );
            nextSubY += 20;
          }

          if (hasMissExtC && c.nextTung && c.missArrC !== null) {
            const subY = nextSubY;
            const mTStart = rel(c.nextTung.jeff);
            const mTEnd = rel(c.missArrC);
            const penC = c.missArrC - c.primaryArr;
            const missCPayload: Omit<TooltipData, 'x' | 'y'> = {
              title: `If you miss the ${fmtTime(c.tung.jeff)} Tungsten at Jeffco`,
              lines: [
                `Next Tungsten departs ${fmtTime(c.nextTung.jeff)}`,
                `Arrive 19th & Illinois: ${fmtTime(c.missArrC)} (${mTEnd}m total, +${penC}m penalty)`,
              ],
              noteTone: 'danger',
            };
            subRows.push(
              <g
                key="miss-c"
                className="svg-seg"
                onMouseEnter={(e) => showTip(e, missCPayload)}
                onMouseMove={(e) => showTip(e, missCPayload)}
                onMouseLeave={hideTip}
              >
                <rect
                  x={xOf(cJeffRel)}
                  y={subY - 5.5}
                  width={wOf(mTStart - cJeffRel)}
                  height="11"
                  rx="2"
                  fill={`url(#hatchRed_${uid})`}
                  stroke="#ef4444"
                  strokeWidth="1"
                />
                <rect
                  x={xOf(mTStart)}
                  y={subY - 5.5}
                  width={wOf(mTEnd - mTStart)}
                  height="11"
                  rx="2.5"
                  fill="#cbd5e1"
                  stroke="#64748b"
                  strokeDasharray="3 2"
                />
                {xOf(mTEnd) + 205 <= W - 8 ? (
                  <text
                    x={xOf(mTEnd) + 6}
                    y={subY + 3.5}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#b91c1c"
                  >
                    If Tungsten leaves: {fmtShort(c.missArrC)} ({mTEnd}m, +{penC}m)
                  </text>
                ) : (
                  <text
                    x={xOf(cJeffRel) - 8}
                    y={subY + 3.5}
                    textAnchor="end"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#b91c1c"
                  >
                    If Tungsten leaves: {fmtShort(c.missArrC)} ({mTEnd}m, +{penC}m)
                  </text>
                )}
              </g>
            );
          }

          return (
            <>
              {ev.train.short && c.nextW && stPayload && (() => {
                const w2Start = rel(c.nextW.fed + ev.delayMin);
                return (
                  <g
                    className="svg-seg"
                    onMouseEnter={(e) => showTip(e, stPayload)}
                    onMouseMove={(e) => showTip(e, stPayload)}
                    onMouseLeave={hideTip}
                  >
                    <rect
                      x={xOf(fedRel)}
                      y={yC - 9}
                      width={wOf(w2Start - fedRel)}
                      height="18"
                      rx="3"
                      fill={`url(#hatchRed_${uid})`}
                      stroke="#dc2626"
                    />
                    <text
                      x={xOf((fedRel + w2Start) / 2)}
                      y={yC + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fill="#991b1b"
                    >
                      ⛔ +{c.railWaitFed}m W
                    </text>
                    <rect
                      x={xOf(w2Start)}
                      y={yC - 9}
                      width={wOf(cJeffRel - w2Start)}
                      height="18"
                      rx="4"
                      fill={`url(#hatchTeal_${uid})`}
                      stroke="#0284c7"
                    />
                    <text
                      x={xOf((w2Start + cJeffRel) / 2)}
                      y={yC + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fill="#0369a1"
                    >
                      2nd W
                    </text>
                  </g>
                );
              })()}

              {/* Wait at Jeffco */}
              <g
                className="svg-seg"
                onMouseEnter={(e) => showTip(e, cWaitPayload)}
                onMouseMove={(e) => showTip(e, cWaitPayload)}
                onMouseLeave={hideTip}
              >
                {c.waitC > 0 ? (
                  <>
                    <rect
                      x={xOf(cJeffRel)}
                      y={yC - 9}
                      width={wOf(cTungStart - cJeffRel)}
                      height="18"
                      rx="3"
                      fill={c.missedRecentC ? `url(#hatchRed_${uid})` : waitColor(c.statusC)}
                      stroke={c.missedRecentC ? '#dc2626' : 'none'}
                    />
                    {c.waitC >= 5 && (
                      <text
                        x={xOf((cJeffRel + cTungStart) / 2)}
                        y={yC + 3.5}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="800"
                        fill={waitTextColor(c.statusC)}
                      >
                        {c.missedRecentC ? `✗-${c.missedByC}m` : `+${c.waitC}m`}
                      </text>
                    )}
                  </>
                ) : (
                  <rect
                    x={xOf(cJeffRel) - 2}
                    y={yC - 11}
                    width="5"
                    height="22"
                    rx="2"
                    fill="#dc2626"
                  />
                )}
              </g>

              {walkMode === 'ctlm' && cCtlmEnd !== null && cCtlmWalkEnd !== null ? (
                <g
                  className="svg-seg"
                  onMouseEnter={(e) => showTip(e, ctPayload)}
                  onMouseMove={(e) => showTip(e, ctPayload)}
                  onMouseLeave={hideTip}
                >
                  <rect
                    x={xOf(cTungStart)}
                    y={yC - 9}
                    width={wOf(cKafEnd - cTungStart)}
                    height="18"
                    rx="3"
                    fill="#475569"
                  />
                  <rect
                    x={xOf(cKafEnd)}
                    y={yC - 9}
                    width={wOf(cCtlmEnd - cKafEnd)}
                    height="18"
                    rx="3"
                    fill="#64748b"
                  />
                  <text
                    x={xOf((cTungStart + cCtlmEnd) / 2)}
                    y={yC + 3.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#fff"
                  >
                    Tungsten → CTLM ({fmtShort(c.tung.jeff)}→{fmtShort(c.tung.ctlm!)})
                  </text>
                  <rect
                    x={xOf(cCtlmEnd)}
                    y={yC - 7}
                    width={wOf(cCtlmWalkEnd - cCtlmEnd)}
                    height="14"
                    rx="2"
                    fill="#d1fae5"
                    stroke="#059669"
                    strokeWidth="1.5"
                  />
                </g>
              ) : (
                <>
                  <g
                    className="svg-seg"
                    onMouseEnter={(e) => showTip(e, kPayload)}
                    onMouseMove={(e) => showTip(e, kPayload)}
                    onMouseLeave={hideTip}
                  >
                    <rect
                      x={xOf(cTungStart)}
                      y={yC - 9}
                      width={wOf(cKafEnd - cTungStart)}
                      height="18"
                      rx="4"
                      fill="#475569"
                    />
                    <text
                      x={xOf((cTungStart + cKafEnd) / 2)}
                      y={yC + 3.5}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#fff"
                    >
                      Tung ({fmtShort(c.tung.jeff)}→{fmtShort(c.tung.kaf)})
                    </text>
                  </g>
                  <g
                    className="svg-seg"
                    onMouseEnter={(e) => showTip(e, kwPayload)}
                    onMouseMove={(e) => showTip(e, kwPayload)}
                    onMouseLeave={hideTip}
                  >
                    <rect
                      x={xOf(cKafEnd)}
                      y={yC - 7}
                      width={wOf(cKafWalkEnd - cKafEnd)}
                      height="14"
                      rx="3"
                      fill="#d1fae5"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <text
                      x={xOf((cKafEnd + cKafWalkEnd) / 2)}
                      y={yC + 3}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="800"
                      fill="#065f46"
                    >
                      4m
                    </text>
                  </g>
                </>
              )}

              {(c.zeroHoldRisk || c.tightC) && (
                <>
                  <rect
                    x={xOf(primaryEndRel) + 6}
                    y={yC - 9}
                    width="64"
                    height="18"
                    rx="4"
                    fill={c.zeroHoldRisk ? '#fef2f2' : '#fffbeb'}
                    stroke={c.zeroHoldRisk ? '#ef4444' : '#f59e0b'}
                  />
                  <text
                    x={xOf(primaryEndRel) + 38}
                    y={yC + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill={c.zeroHoldRisk ? '#991b1b' : '#92400e'}
                  >
                    {c.zeroHoldRisk ? '! 0m HOLD?' : `! +${c.waitC}m`}
                  </text>
                </>
              )}

              <text
                x={W - RIGHT + 10}
                y={yC + 1}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11.5"
                fontWeight="800"
                fill={winC ? '#b45309' : '#0f172a'}
              >
                {fmtTime(c.primaryArr)} ({c.durC}m)
              </text>
              {winC ? (
                <text x={W - RIGHT + 10} y={yC + 13} fontSize="9.5" fontWeight="800" fill="#b45309">
                  ★ FASTEST{c.zeroHoldRisk ? ' (0m HOLD?)' : ''}
                </text>
              ) : ev.train.short ? (
                <text x={W - RIGHT + 10} y={yC + 13} fontSize="9.5" fontWeight="800" fill="#dc2626">
                  ⛔ +{c.railWaitFed}m SHORT-TURN
                </text>
              ) : c.missedRecentC ? (
                <text x={W - RIGHT + 10} y={yC + 13} fontSize="9.5" fontWeight="800" fill="#dc2626">
                  ✗ MISSED BY {c.missedByC}m
                </text>
              ) : null}

              {subRows}
            </>
          );
        })()
      )}
    </svg>
  );
};
