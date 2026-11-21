export type ScheduleDay = 'weekday' | 'weekend';
export type DisplayMode = 'hourly' | 'all' | 'traps';
export type WalkMode = 'both' | 'kafadar' | 'ctlm';
export type TransferStatus = 'ok' | 'sprint' | 'tight' | 'long' | 'missed' | 'zero';
export type PathId = 'A' | 'B' | 'C';

export const WALK_R17 = 4; // Wash Ave & 19th -> 19th & Illinois (0.20 mi)
export const WALK_KAF = 4; // Kafadar Commons (16th & Ill) -> 19th & Illinois (0.22 mi)
export const WALK_CTLM = 1; // CTLM Lot -> 19th & Illinois (0.05 mi)
export const MIN_XFER_OAK = 1; // Min realistic platform->Gate D sprint at Oak
export const MIN_XFER_FED = 1; // Min realistic platform->Gate D walk at Fed Center
export const MIN_XFER_JEFF = 0; // 0m flagged as "Hold?" risk; <0m is missed

export interface R17Trip {
  fed: number;
  oak: number;
  wash: number;
  headway: number;
}

export interface TungstenTrip {
  jeff: number;
  kaf: number;
  ctlm: number | null;
}

export interface WLineTrain {
  oak: number;
  fed: number;
  jeff: number | null;
  short: boolean;
  regime: string;
}

export interface PathAEval {
  r17: R17Trip;
  wait: number;
  arr: number;
  dur: number;
  status: TransferStatus;
  missedRecent: boolean;
  missedBy: number | null;
  risky: boolean;
  nextR17: R17Trip | null;
  missArr: number | null;
}

export interface PathBEval {
  r17: R17Trip;
  wait: number;
  arr: number;
  dur: number;
  status: TransferStatus;
  missedRecent: boolean;
  sameBusAsA: boolean;
  risky: boolean;
  nextR17: R17Trip | null;
  missArr: number | null;
}

export interface PathCEvalUnavailable {
  available: false;
  reason: string;
  jeffAct: number | null;
  nextW: WLineTrain | null;
  railWaitFed: number;
}

export interface PathCEvalAvailable {
  available: true;
  jeffAct: number;
  nextW: WLineTrain | null;
  railWaitFed: number;
  tung: TungstenTrip;
  waitC: number;
  statusC: TransferStatus;
  missedRecentC: boolean;
  missedByC: number | null;
  arrKafWalk: number;
  arrCtlmWalk: number | null;
  primaryArr: number;
  durC: number;
  zeroHoldRisk: boolean;
  tightC: boolean;
  nextTung: TungstenTrip | null;
  missArrC: number | null;
}

export type PathCEval = PathCEvalUnavailable | PathCEvalAvailable;

export interface TrainEvaluation {
  train: WLineTrain;
  t0: number;
  oakAct: number;
  fedAct: number;
  delayMin: number;
  A: PathAEval;
  B: PathBEval;
  C: PathCEval;
  winners: PathId[];
  minDur: number;
}

export interface GroupedPattern {
  sig: string;
  ev: TrainEvaluation;
  repeats: TrainEvaluation[];
}

export interface SummaryStats {
  total: number;
  shortCount: number;
  shortPct: number;
  oakTightOrMiss: number;
  avgA: number;
  winCounts: Record<PathId, number>;
  avgC: number | null;
  oreActiveCount: number;
}

export function fmtTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mn = m % 60;
  const ap = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mn).padStart(2, '0')} ${ap}`;
}

export function fmtShort(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mn = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mn).padStart(2, '0')}`;
}

export function fmtHour(h: number): string {
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${ap}`;
}

export function fmtHourCompact(h: number): string {
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export function buildR17(day: ScheduleDay): R17Trip[] {
  const trips: R17Trip[] = [];
  if (day === 'weekday') {
    // Early AM verified NextRide stops: 3:44->3:52, 4:43->4:52, 5:13->5:22, 5:43->5:52
    const early: Array<[number, number, number]> = [
      [224, 8, 20],
      [283, 9, 20],
      [313, 9, 20],
      [343, 9, 20],
    ];
    early.forEach(([fed, od, ride]) => {
      trips.push({ fed, oak: fed + od, wash: fed + od + ride, headway: 30 });
    });
    // 5:58 AM - 6:28 PM every 15 min (:13, :28, :43, :58 from Fed Ctr)
    for (let t = 358; t <= 1108; t += 15) {
      const pmPeak = t >= 900 && t <= 1078;
      const od = pmPeak && t % 60 === 13 ? 10 : 9;
      const ride = pmPeak ? 21 : 20;
      trips.push({ fed: t, oak: t + od, wash: t + od + ride, headway: 15 });
    }
    // Evening 6:43 PM - 12:43 AM every 30 min (:13, :43)
    for (let t = 1123; t <= 1483; t += 30) {
      trips.push({ fed: t, oak: t + 9, wash: t + 29, headway: 30 });
    }
  } else {
    // Weekend: every 30 min all day (:13, :43 Fed Ctr -> :22, :52 Oak -> :42, :12 Wash & 19th)
    for (let t = 283; t <= 1483; t += 30) {
      trips.push({ fed: t, oak: t + 9, wash: t + 29, headway: 30 });
    }
  }
  return trips;
}

export function buildTungsten(day: ScheduleDay): TungstenTrip[] {
  const trips: TungstenTrip[] = [];
  if (day === 'weekday') {
    const exact: Array<[number, number, number | null]> = [
      [420, 17, 25], // 7:00 AM -> Kaf 7:17, CTLM 7:25
      [455, 12, 20], // 7:35 AM -> Kaf 7:47, CTLM 7:55
      [485, 12, 20], // 8:05 AM -> Kaf 8:17, CTLM 8:25
      [500, 12, 20], // 8:20 AM -> Kaf 8:32, CTLM 8:40
    ];
    for (let t = 515; t <= 1040; t += 15) {
      exact.push([t, 14, 22]); // 8:35 AM - 5:20 PM (:05,:20,:35,:50)
    }
    exact.push([1055, 12, 20]); // 5:35 PM
    exact.push([1070, 12, 20]); // 5:50 PM
    exact.push([1085, 10, null]); // 6:05 PM (ends Kafadar 6:15)
    exact.push([1098, 12, null]); // 6:18 PM (last trip, ends Kafadar 6:30)
    exact.forEach(([jeff, kd, cd]) => {
      trips.push({ jeff, kaf: jeff + kd, ctlm: cd !== null ? jeff + cd : null });
    });
  } else {
    // Sat & Sun schedule (8:20 AM - 4:50 PM every 30 min)
    for (let t = 500; t <= 980; t += 30) {
      trips.push({ jeff: t, kaf: t + 14, ctlm: t + 22 });
    }
    trips.push({ jeff: 1010, kaf: 1020, ctlm: null }); // 4:50 PM last trip -> Kafadar 5:00 PM
  }
  return trips;
}

export function buildWLine(day: ScheduleDay): WLineTrain[] {
  const trains: WLineTrain[] = [];
  if (day === 'weekday') {
    // 5 AM hour (early startup)
    [297, 319, 334, 349].forEach((oak) => {
      trains.push({
        oak,
        fed: oak + 5,
        jeff: oak + 14,
        short: false,
        regime: 'Early Morning (15–22m)',
      });
    });
    // 6:04 AM - 1:49 PM (:04, :19, :34, :49) THRU
    for (let t = 364; t <= 829; t += 15) {
      const reg = t < 540 ? 'AM Peak (15m • All Thru)' : 'Midday Clockface (15m • All Thru)';
      trains.push({ oak: t, fed: t + 5, jeff: t + 14, short: false, regime: reg });
    }
    // 2:06 PM - 5:51 PM PM Peak +2m shift (:06, :21, :36, :51) THRU
    for (let t = 846; t <= 1071; t += 15) {
      trains.push({
        oak: t,
        fed: t + 5,
        jeff: t + 14,
        short: false,
        regime: 'PM Peak Shift (+2m • 15m All Thru)',
      });
    }
    // 6:04, 6:19 PM THRU
    [1084, 1099].forEach((oak) => {
      trains.push({
        oak,
        fed: oak + 5,
        jeff: oak + 14,
        short: false,
        regime: 'Evening Transition (Ore Cart Closes 6:18 PM)',
      });
    });
    // 6:34 PM - 8:04 PM alternating SHORT-TURN (:34, :04) and THRU (:49, :19)
    for (let t = 1114; t <= 1204; t += 15) {
      const isShort = t % 30 === 4;
      trains.push({
        oak: t,
        fed: t + 5,
        jeff: isShort ? null : t + 14,
        short: isShort,
        regime: 'Evening Short-Turn Window (Alternating Fed Ctr / Jeffco)',
      });
    }
    // 8:19 PM - 11:49 PM every 30 min THRU
    for (let t = 1219; t <= 1429; t += 30) {
      trains.push({
        oak: t,
        fed: t + 5,
        jeff: t + 14,
        short: false,
        regime: 'Late Evening (30m • All Thru, Ore Cart Closed)',
      });
    }
  } else {
    // Weekend early AM 5:05 - 8:35 every 30m THRU
    for (let t = 305; t <= 515; t += 30) {
      trains.push({
        oak: t,
        fed: t + 4,
        jeff: t + 13,
        short: false,
        regime: 'Early Weekend (30m • All Thru)',
      });
    }
    // 8:50 AM - 12:50 PM alternating: :05/:35 SHORT, :20/:50 THRU
    trains.push({
      oak: 530,
      fed: 534,
      jeff: 543,
      short: false,
      regime: 'Weekend Morning Transition',
    });
    for (let t = 545; t <= 770; t += 15) {
      const isShort = t % 30 === 5;
      trains.push({
        oak: t,
        fed: t + 4,
        jeff: isShort ? null : t + 13,
        short: isShort,
        regime: 'Weekend Daytime (Alternating Short-Turn & Thru)',
      });
    }
    // 1:06 PM - 8:36 PM (+1m PM shift: :06/:36 SHORT, :21/:51 THRU)
    for (let t = 786; t <= 1236; t += 15) {
      const isShort = t % 30 === 6;
      const reg =
        t < 1020
          ? 'Weekend Afternoon (+1m • Alternating Short-Turn & Thru)'
          : 'Weekend Evening (Alternating Short-Turn • Ore Cart Closed)';
      trains.push({
        oak: t,
        fed: t + 4,
        jeff: isShort ? null : t + 13,
        short: isShort,
        regime: reg,
      });
    }
    // 8:51 PM - 11:51 PM every 30m THRU
    for (let t = 1251; t <= 1431; t += 30) {
      trains.push({
        oak: t,
        fed: t + 4,
        jeff: t + 13,
        short: false,
        regime: 'Weekend Late Night (30m • All Thru)',
      });
    }
  }
  return trains;
}

export function evaluateTrain(
  train: WLineTrain,
  allW: WLineTrain[],
  r17List: R17Trip[],
  tungList: TungstenTrip[],
  delayMin: number,
  walkMode: WalkMode
): TrainEvaluation {
  const t0 = train.oak;
  const oakAct = train.oak + delayMin;
  const fedAct = train.fed + delayMin;

  // --- PATH A: Oak -> Route 17 -> Wash & 19th -> Walk 4m ---
  const r17AIdx = r17List.findIndex((b) => b.oak >= oakAct + MIN_XFER_OAK);
  const r17A = r17List[r17AIdx];
  const prevR17A = r17AIdx > 0 ? r17List[r17AIdx - 1] : null;
  const missedRecentA = Boolean(
    prevR17A && oakAct - prevR17A.oak >= 0 && oakAct - prevR17A.oak <= 4
  );
  const missedByA = missedRecentA && prevR17A ? oakAct - prevR17A.oak : null;

  const waitA = r17A.oak - oakAct;
  const arrA = r17A.wash + WALK_R17;
  const durA = arrA - oakAct;
  const riskyA = waitA <= 3;
  const nextR17A = riskyA && r17AIdx + 1 < r17List.length ? r17List[r17AIdx + 1] : null;
  const missArrA = nextR17A ? nextR17A.wash + WALK_R17 : null;

  let statusA: TransferStatus = 'ok';
  if (missedRecentA) statusA = 'missed';
  else if (waitA <= 2) statusA = 'sprint';
  else if (waitA === 3) statusA = 'tight';
  else if (waitA > 9) statusA = 'long';

  // --- PATH B: Fed Center -> Route 17 (backtracks via Oak) -> Wash & 19th -> Walk 4m ---
  const r17BIdx = r17List.findIndex((b) => b.fed >= fedAct + MIN_XFER_FED);
  const r17B = r17List[r17BIdx];
  const prevR17B = r17BIdx > 0 ? r17List[r17BIdx - 1] : null;
  const missedRecentB = Boolean(
    prevR17B && fedAct - prevR17B.fed >= 0 && fedAct - prevR17B.fed <= 3
  );
  const waitB = r17B.fed - fedAct;
  const arrB = r17B.wash + WALK_R17;
  const durB = arrB - oakAct;
  const sameBusAsA = r17A.fed === r17B.fed;
  const riskyB = waitB <= 2;
  const nextR17B = riskyB && r17BIdx + 1 < r17List.length ? r17List[r17BIdx + 1] : null;
  const missArrB = nextR17B ? nextR17B.wash + WALK_R17 : null;

  let statusB: TransferStatus = 'ok';
  if (missedRecentB) statusB = 'missed';
  else if (waitB <= 2) statusB = 'sprint';
  else if (waitB === 3) statusB = 'tight';
  else if (waitB > 9) statusB = 'long';

  // --- PATH C: (If short-turn -> Fed Ctr wait -> Next W) -> Jeffco -> Ore Cart Tungsten ---
  let nextW: WLineTrain | null = null;
  let railWaitFed = 0;
  let jeffAct: number | null = null;
  if (train.short) {
    nextW = allW.find((w) => !w.short && w.fed + delayMin > fedAct) ?? null;
    if (nextW && nextW.jeff !== null) {
      railWaitFed = nextW.fed + delayMin - fedAct;
      jeffAct = nextW.jeff + delayMin;
    }
  } else if (train.jeff !== null) {
    jeffAct = train.jeff + delayMin;
  }

  let pathC: PathCEval = {
    available: false,
    reason: 'Ore Cart Closed',
    jeffAct,
    nextW,
    railWaitFed,
  };

  if (jeffAct !== null) {
    const tIdx = tungList.findIndex((u) => u.jeff >= jeffAct + MIN_XFER_JEFF);
    const prevT = tIdx > 0 ? tungList[tIdx - 1] : null;
    const lastT = tungList[tungList.length - 1];
    if (tIdx === -1) {
      pathC = {
        available: false,
        reason: `Ore Cart Closed (Last Tungsten left Jeffco at ${fmtTime(lastT.jeff)})`,
        jeffAct,
        nextW,
        railWaitFed,
      };
    } else {
      const tung = tungList[tIdx];
      const waitC = tung.jeff - jeffAct;
      if (waitC > 45) {
        pathC = {
          available: false,
          reason: `Ore Cart Not Yet Running (First Tungsten at ${fmtTime(tung.jeff)})`,
          jeffAct,
          nextW,
          railWaitFed,
        };
      } else {
        const missedRecentC = Boolean(
          prevT && jeffAct - prevT.jeff > 0 && jeffAct - prevT.jeff <= 5
        );
        const missedByC = missedRecentC && prevT ? jeffAct - prevT.jeff : null;
        const arrKafWalk = tung.kaf + WALK_KAF;
        const arrCtlmWalk = tung.ctlm !== null ? tung.ctlm + WALK_CTLM : null;
        const useCtlm = walkMode === 'ctlm' && arrCtlmWalk !== null;
        const primaryArr = useCtlm && arrCtlmWalk !== null ? arrCtlmWalk : arrKafWalk;
        const durC = primaryArr - oakAct;
        const zeroHoldRisk = waitC === 0;
        const tightC = waitC >= 1 && waitC <= 2;
        const nextTung = tIdx + 1 < tungList.length ? tungList[tIdx + 1] : null;
        const missArrC =
          (zeroHoldRisk || tightC) && nextTung
            ? walkMode === 'ctlm' && nextTung.ctlm !== null
              ? nextTung.ctlm + WALK_CTLM
              : nextTung.kaf + WALK_KAF
            : null;

        let statusC: TransferStatus = 'ok';
        if (missedRecentC) statusC = 'missed';
        else if (zeroHoldRisk) statusC = 'zero';
        else if (tightC) statusC = 'sprint';
        else if (waitC > 9) statusC = 'long';

        pathC = {
          available: true,
          jeffAct,
          nextW,
          railWaitFed,
          tung,
          waitC,
          statusC,
          missedRecentC,
          missedByC,
          arrKafWalk,
          arrCtlmWalk,
          primaryArr,
          durC,
          zeroHoldRisk,
          tightC,
          nextTung,
          missArrC,
        };
      }
    }
  }

  const candidates: Array<{ id: PathId; dur: number }> = [
    { id: 'A', dur: durA },
    { id: 'B', dur: durB },
  ];
  if (pathC.available) {
    candidates.push({ id: 'C', dur: pathC.durC });
  }
  const minDur = Math.min(...candidates.map((c) => c.dur));
  const winners = candidates.filter((c) => c.dur === minDur).map((c) => c.id);

  return {
    train,
    t0,
    oakAct,
    fedAct,
    delayMin,
    A: {
      r17: r17A,
      wait: waitA,
      arr: arrA,
      dur: durA,
      status: statusA,
      missedRecent: missedRecentA,
      missedBy: missedByA,
      risky: riskyA,
      nextR17: nextR17A,
      missArr: missArrA,
    },
    B: {
      r17: r17B,
      wait: waitB,
      arr: arrB,
      dur: durB,
      status: statusB,
      missedRecent: missedRecentB,
      sameBusAsA,
      risky: riskyB,
      nextR17: nextR17B,
      missArr: missArrB,
    },
    C: pathC,
    winners,
    minDur,
  };
}

export function groupIdenticalInHour(evs: TrainEvaluation[]): GroupedPattern[] {
  const buckets: GroupedPattern[] = [];
  evs.forEach((ev) => {
    const sig = [
      ev.train.short ? 'S' : 'T',
      ev.A.wait,
      ev.A.dur,
      ev.A.status,
      ev.B.wait,
      ev.B.dur,
      ev.B.sameBusAsA ? 1 : 0,
      ev.C.available ? `C${ev.C.waitC}_${ev.C.durC}_${ev.C.railWaitFed}` : 'NO_C',
    ].join('|');
    const found = buckets.find((b) => b.sig === sig);
    if (found) found.repeats.push(ev);
    else buckets.push({ sig, ev, repeats: [ev] });
  });
  return buckets;
}

export function groupByHour(evaluated: TrainEvaluation[]): Map<number, TrainEvaluation[]> {
  const hoursMap = new Map<number, TrainEvaluation[]>();
  for (let h = 5; h <= 23; h++) hoursMap.set(h, []);
  evaluated.forEach((ev) => {
    const h = Math.floor(ev.train.oak / 60);
    if (hoursMap.has(h)) {
      hoursMap.get(h)!.push(ev);
    } else if (h === 4) {
      hoursMap.get(5)!.push(ev);
    }
  });
  return hoursMap;
}

export function filterEvaluationsInHour(
  evs: TrainEvaluation[],
  mode: DisplayMode
): GroupedPattern[] {
  if (mode === 'all') {
    return evs.map((ev) => ({ sig: `single-${ev.train.oak}`, ev, repeats: [ev] }));
  }
  if (mode === 'traps') {
    const filtered = evs.filter(
      (e) =>
        e.train.short ||
        e.A.status === 'missed' ||
        e.A.status === 'sprint' ||
        (e.C.available && (e.C.zeroHoldRisk || e.C.missedRecentC))
    );
    return groupIdenticalInHour(filtered);
  }
  return groupIdenticalInHour(evs);
}

export function computeSummaryStats(evaluated: TrainEvaluation[]): SummaryStats {
  const total = evaluated.length;
  const shortCount = evaluated.filter((e) => e.train.short).length;
  const shortPct = total > 0 ? Math.round((shortCount / total) * 100) : 0;
  const oakTightOrMiss = evaluated.filter(
    (e) => e.A.status === 'missed' || e.A.status === 'sprint'
  ).length;
  const winCounts: Record<PathId, number> = { A: 0, B: 0, C: 0 };
  evaluated.forEach((e) => {
    if (e.winners.includes('A')) winCounts.A++;
    if (e.winners.includes('B') && !e.winners.includes('A')) winCounts.B++;
    if (e.winners.includes('C') && !e.winners.includes('A') && !e.winners.includes('B')) {
      winCounts.C++;
    }
  });
  const avgA =
    total > 0 ? Math.round(evaluated.reduce((sum, e) => sum + e.A.dur, 0) / total) : 0;
  const oreEvs = evaluated.filter(
    (e): e is TrainEvaluation & { C: PathCEvalAvailable } => e.C.available
  );
  const avgC =
    oreEvs.length > 0
      ? Math.round(oreEvs.reduce((sum, e) => sum + e.C.durC, 0) / oreEvs.length)
      : null;

  return {
    total,
    shortCount,
    shortPct,
    oakTightOrMiss,
    avgA,
    winCounts,
    avgC,
    oreActiveCount: oreEvs.length,
  };
}

export function buildTakeawayParts(
  ev: TrainEvaluation,
  delayMin: number
): { heading: string; body: string } {
  if (ev.train.short) {
    const sameBusText = ev.B.sameBusAsA
      ? ` Riding 1 stop to Federal Center catches the exact same Bus 17 at its sheltered starting gate (+${ev.B.wait}m wait vs. +${ev.A.wait}m at Oak).`
      : '';
    return {
      heading: 'Short-Turn Impact:',
      body: `This W train ends at Federal Center (${fmtTime(ev.fedAct)}). Staying on for Jeffco adds a +${ev.C.railWaitFed}m rail wait.${sameBusText}`,
    };
  }
  if (ev.A.missedRecent) {
    const tieText = ev.B.sameBusAsA ? ' (tying Path B on the exact same next bus)' : '';
    return {
      heading: 'Oak Near-Miss:',
      body: `At +${delayMin}m delay, Bus 17 left Oak ${ev.A.missedBy}m before W arrived—pushing Path A to ${ev.A.dur}m${tieText}.`,
    };
  }
  if (ev.A.risky && ev.C.available && ev.C.zeroHoldRisk) {
    return {
      heading: 'Double Razor-Edge:',
      body: `Oak W→17 is a +${ev.A.wait}m sprint AND Jeffco W→Tungsten is a 0m scheduled gap. Path B (Fed Center Gate D, +${ev.B.wait}m wait) is the only stress-free guaranteed transfer.`,
    };
  }
  if (ev.A.risky) {
    const missText = ev.A.missArr
      ? ` Missing it adds +${ev.A.missArr - ev.A.arr}m.`
      : '';
    return {
      heading: 'Oak Sprint Alert:',
      body: `Only +${ev.A.wait}m between W arriving Oak and Bus 17 departing Gate D.${missText}`,
    };
  }
  if (ev.C.available && ev.C.zeroHoldRisk) {
    return {
      heading: 'Jeffco 0m Connection:',
      body: `W arrives Jeffco at the exact minute Tungsten departs (${fmtTime(ev.C.tung.jeff)}). If the shuttle doesn't hold, you drop +15m behind.`,
    };
  }
  if (ev.B.sameBusAsA) {
    return {
      heading: 'Same Bus Tie:',
      body: `Staying on W one extra stop to Federal Center catches the exact same Bus 17 (${fmtTime(ev.B.r17.fed)} Gate D) with a shorter outdoor wait (+${ev.B.wait}m vs +${ev.A.wait}m at Oak).`,
    };
  }
  const oreText = ev.C.available
    ? `Tungsten via Kafadar + 4m walk arrives ${
        ev.C.durC - ev.A.dur >= 0
          ? `+${ev.C.durC - ev.A.dur}m after`
          : `${ev.A.dur - ev.C.durC}m before`
      } Path A.`
    : 'Ore Cart is closed during this hour.';
  return {
    heading: 'Clean Alignment:',
    body: `Oak W→17 has a comfortable +${ev.A.wait}m transfer buffer; ${oreText}`,
  };
}
