import React from 'react';

export const CorridorMap: React.FC = () => {
  return (
    <section
      id="topology"
      aria-labelledby="topology-heading"
      className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="topology-heading"
          className="text-[16px] font-bold tracking-tight text-slate-900"
        >
          Corridor Topology &amp; Common Midpoint Walk Comparison
        </h2>
        <p className="text-xs text-slate-500">
          Why the same W Line train behaves differently by exit station and short-turn status
        </p>
      </div>

      <div className="w-full overflow-x-auto pb-1">
        <svg
          viewBox="0 0 1160 225"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Corridor schematic showing W Line westbound stations, Federal Center short-turn hub, Route 17 backtrack loop, Ore Cart Tungsten stops, and 4-minute walks to 19th and Illinois Street"
          className="block h-auto w-full min-w-[820px]"
        >
          <defs>
            <marker
              id="arrBlue"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#1d4ed8" />
            </marker>
            <marker
              id="arrSlate"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker
              id="arrGreen"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
            </marker>
          </defs>

          {/* Background zone boxes */}
          <rect
            x="6"
            y="8"
            width="1148"
            height="210"
            rx="10"
            fill="#f8fafc"
            stroke="#e2e8f0"
          />
          <rect
            x="758"
            y="20"
            width="382"
            height="186"
            rx="8"
            fill="#ecfdf5"
            fillOpacity="0.6"
            stroke="#a7f3d0"
            strokeDasharray="4 3"
          />
          <text
            x="772"
            y="38"
            fontSize="10.5"
            fontWeight="700"
            fill="#065f46"
            letterSpacing="0.04em"
          >
            Golden Common Midpoint Zone
          </text>

          {/* W LINE TRUNK */}
          <text x="24" y="60" fontSize="11" fontWeight="800" fill="#00778b">
            W Line Westbound
          </text>
          <text x="24" y="74" fontSize="10.5" fill="#64748b">
            From Union Station →
          </text>

          {/* Double-track section to Fed Center */}
          <line
            x1="165"
            y1="64"
            x2="405"
            y2="64"
            stroke="#00778b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Single-track section Fed Center to Jeffco */}
          <line
            x1="405"
            y1="64"
            x2="700"
            y2="64"
            stroke="#00778b"
            strokeWidth="4"
            strokeDasharray="10 4"
          />
          <text
            x="552"
            y="51"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#00778b"
          >
            Single-Track Segment (+9m)
          </text>
          <text
            x="552"
            y="81"
            textAnchor="middle"
            fontSize="9.5"
            fill="#dc2626"
            fontWeight="700"
          >
            Short-turn trains END at Federal Center
          </text>

          {/* Oak Station Node */}
          <circle cx="215" cy="64" r="9" fill="#fff" stroke="#00778b" strokeWidth="4" />
          <text
            x="215"
            y="42"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#0f172a"
          >
            Oak Station
          </text>
          <text
            x="215"
            y="28"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#00778b"
          >
            T+0 (Decision Point)
          </text>

          {/* Federal Center Node */}
          <circle cx="405" cy="64" r="9" fill="#fff" stroke="#dc2626" strokeWidth="4" />
          <text
            x="405"
            y="42"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#0f172a"
          >
            Federal Center
          </text>
          <text
            x="405"
            y="28"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#dc2626"
          >
            T+4–5m · Short-Turn Hub
          </text>

          {/* Red Rocks Node */}
          <circle cx="552" cy="64" r="6" fill="#fff" stroke="#00778b" strokeWidth="3" />
          <text x="552" y="96" textAnchor="middle" fontSize="10" fill="#64748b">
            Red Rocks (+4m)
          </text>

          {/* Jeffco Gov Center Node */}
          <circle cx="700" cy="64" r="9" fill="#fff" stroke="#00778b" strokeWidth="4" />
          <text
            x="700"
            y="42"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#0f172a"
          >
            Jeffco Gov Ctr
          </text>
          <text
            x="700"
            y="28"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#00778b"
          >
            T+13–14m (Terminus)
          </text>

          {/* ROUTE 17 BACKTRACK LOOP */}
          <path
            d="M 405 74 L 405 138 Q 405 152 390 152 L 230 152 Q 215 152 215 138 L 215 114"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="3.5"
            strokeDasharray="5 3"
            markerEnd="url(#arrBlue)"
          />
          <rect
            x="240"
            y="139"
            width="138"
            height="24"
            rx="5"
            fill="#eff6ff"
            stroke="#93c5fd"
          />
          <text
            x="309"
            y="154"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#1e40af"
          >
            17 Backtracks East (+9m)
          </text>
          <text
            x="418"
            y="128"
            textAnchor="start"
            fontSize="10"
            fontWeight="700"
            fill="#1d4ed8"
          >
            Path B: Board 17 at Gate D
          </text>

          {/* Oak Gate D to Washington & 19th */}
          <path
            d="M 215 74 L 215 100"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="3 2"
          />
          <circle cx="215" cy="106" r="6" fill="#1d4ed8" />
          <text x="202" y="109" textAnchor="end" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
            Path A: Oak Gate D
          </text>
          <text x="202" y="122" textAnchor="end" fontSize="9.5" fill="#92400e" fontWeight="700">
            1–3m Sprint / Near-Miss
          </text>

          <path
            d="M 222 106 L 340 106 Q 355 106 368 122 L 420 184 Q 430 194 448 194 L 833 194"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="4.5"
            markerEnd="url(#arrBlue)"
          />
          <text
            x="615"
            y="186"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            fill="#1d4ed8"
          >
            Route 17 West via Colfax &amp; S. Golden Rd (+20–21m from Oak)
          </text>

          {/* Washington Ave & 19th St Stop */}
          <circle cx="848" cy="194" r="7" fill="#fff" stroke="#1d4ed8" strokeWidth="3.5" />
          <text
            x="848"
            y="177"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#1e3a8a"
          >
            Wash Ave &amp; 19th St
          </text>
          <text x="848" y="211" textAnchor="middle" fontSize="9.5" fill="#475569">
            Route 17 Stop #17149
          </text>

          {/* ORE CART TUNGSTEN PATH */}
          <path
            d="M 709 64 L 836 64"
            fill="none"
            stroke="#475569"
            strokeWidth="4.5"
            markerEnd="url(#arrSlate)"
          />
          <text
            x="774"
            y="56"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#334155"
          >
            Tungsten (+12–14m)
          </text>

          {/* Kafadar Commons Stop */}
          <circle cx="848" cy="64" r="7" fill="#fff" stroke="#475569" strokeWidth="3.5" />
          <text
            x="848"
            y="84"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#334155"
          >
            Kafadar Commons
          </text>
          <text x="848" y="96" textAnchor="middle" fontSize="9.5" fill="#475569">
            16th &amp; Illinois (Timely Stop)
          </text>

          {/* Optional +8m loop to CTLM Lot */}
          <path
            d="M 855 64 L 930 64 Q 950 64 950 84 L 950 100 Q 950 112 965 112 L 1010 112"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrSlate)"
          />
          <text
            x="955"
            y="56"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="700"
            fill="#64748b"
          >
            +8m Downtown Loop
          </text>
          <circle
            cx="1020"
            cy="112"
            r="5.5"
            fill="#fff"
            stroke="#64748b"
            strokeWidth="2.5"
          />
          <text
            x="1082"
            y="108"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#64748b"
          >
            CTLM Lot
          </text>
          <text x="1082" y="120" textAnchor="middle" fontSize="9" fill="#64748b">
            (1m walk, +5m slower)
          </text>

          {/* COMMON MIDPOINT */}
          <rect x="970" y="138" width="154" height="44" rx="8" fill="#059669" />
          <text
            x="1047"
            y="157"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#fff"
          >
            ★ 19th &amp; Illinois St
          </text>
          <text x="1047" y="172" textAnchor="middle" fontSize="10" fill="#d1fae5">
            Common Midpoint
          </text>

          {/* Equal-distance Walk Connectors */}
          <path
            d="M 857 194 L 948 194 Q 958 194 958 184 L 958 172 L 966 172"
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeDasharray="3 3"
            markerEnd="url(#arrGreen)"
          />
          <text
            x="908"
            y="209"
            textAnchor="start"
            fontSize="10"
            fontWeight="800"
            fill="#065f46"
          >
            4m walk (0.20 mi)
          </text>

          <path
            d="M 848 101 L 848 148 Q 848 158 858 158 L 966 158"
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeDasharray="3 3"
            markerEnd="url(#arrGreen)"
          />
          <text
            x="907"
            y="149"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#065f46"
          >
            4m walk (0.22 mi)
          </text>

          <path
            d="M 1020 118 L 1020 135"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
    </section>
  );
};
