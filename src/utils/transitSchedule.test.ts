import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWLine,
  buildR17,
  buildTungsten,
  evaluateTrain,
  groupIdenticalInHour,
  groupByHour,
  computeSummaryStats,
  fmtTime,
} from './transitSchedule';

test('fmtTime formats minutes cleanly in 12-hour clock', () => {
  assert.equal(fmtTime(297), '4:57 AM');
  assert.equal(fmtTime(720), '12:00 PM');
  assert.equal(fmtTime(846), '2:06 PM');
  assert.equal(fmtTime(1440), '12:00 AM');
});

test('Weekday schedule captures PM peak +2m shift double razor-edge (Oak +1-2m & Jeffco 0m)', () => {
  const allW = buildWLine('weekday');
  const r17 = buildR17('weekday');
  const tung = buildTungsten('weekday');

  // 2:06 PM (846) Oak -> 2:20 PM Jeffco; Tungsten departs 2:20 PM (0m gap!)
  const pmTrain = allW.find((t) => t.oak === 846);
  assert.ok(pmTrain, '2:06 PM weekday train must exist');
  assert.equal(pmTrain.short, false);

  const ev = evaluateTrain(pmTrain, allW, r17, tung, 0, 'both');
  assert.equal(ev.A.wait, 1, '2:06 PM Oak -> 2:07 PM Bus 17 should be a +1m sprint');
  assert.equal(ev.A.status, 'sprint');
  assert.equal(ev.C.available, true);
  if (ev.C.available) {
    assert.equal(ev.C.waitC, 0, '2:20 PM Jeffco -> 2:20 PM Tungsten should be 0m gap');
    assert.equal(ev.C.zeroHoldRisk, true);
    assert.equal(ev.C.statusC, 'zero');
    // Kafadar + 4m walk beats CTLM + 1m walk by 5 net minutes
    assert.ok(ev.C.arrCtlmWalk !== null);
    assert.equal(ev.C.arrCtlmWalk - ev.C.arrKafWalk, 5);
  }
});

test('Delay simulator (+2m) turns 2:06 PM Oak sprint into a red near-miss and drops Tungsten by +15m', () => {
  const allW = buildWLine('weekday');
  const r17 = buildR17('weekday');
  const tung = buildTungsten('weekday');
  const pmTrain = allW.find((t) => t.oak === 846)!;

  const onTime = evaluateTrain(pmTrain, allW, r17, tung, 0, 'both');
  const delayed = evaluateTrain(pmTrain, allW, r17, tung, 2, 'both');

  assert.equal(delayed.A.missedRecent, true);
  assert.equal(delayed.A.missedBy, 1);
  assert.equal(delayed.A.status, 'missed');
  assert.ok(delayed.A.dur > onTime.A.dur, 'Missing Bus 17 increases Path A duration');

  assert.equal(delayed.C.available, true);
  if (delayed.C.available && onTime.C.available) {
    assert.equal(delayed.C.missedRecentC, true);
    assert.equal(delayed.C.missedByC, 2);
    assert.ok(delayed.C.durC > onTime.C.durC);
  }
});

test('Weekday evening short-turns insert +15m Fed Ctr rail wait and tie on 30-min Route 17', () => {
  const allW = buildWLine('weekday');
  const r17 = buildR17('weekday');
  const tung = buildTungsten('weekday');

  // 6:34 PM (1114) is short-turn at Fed Ctr during transition to 30m Route 17
  const short634 = allW.find((t) => t.oak === 1114);
  assert.ok(short634);
  assert.equal(short634.short, true);
  assert.equal(short634.jeff, null);

  const ev634 = evaluateTrain(short634, allW, r17, tung, 0, 'both');
  assert.equal(ev634.C.available, false);
  assert.equal(ev634.C.railWaitFed, 15);
  assert.ok(ev634.C.nextW !== null);
  assert.equal(ev634.A.wait, 3, '6:34 PM Oak catches last 15-min Bus 17 at 6:37 PM (+3m)');

  // 7:04 PM (1144) is short-turn once Route 17 is on 30-min headways -> Path B catches exact same bus
  const short704 = allW.find((t) => t.oak === 1144);
  assert.ok(short704);
  const ev704 = evaluateTrain(short704, allW, r17, tung, 0, 'both');
  assert.equal(ev704.C.railWaitFed, 15);
  assert.equal(ev704.B.sameBusAsA, true, 'Path B catches same Bus 17 at sheltered terminus');
  assert.equal(ev704.A.dur, ev704.B.dur);
});

test('Weekend alternating short-turns tie Path A and Path B while penalizing Path C by +15m', () => {
  const allW = buildWLine('weekend');
  const r17 = buildR17('weekend');
  const tung = buildTungsten('weekend');

  // 9:05 AM (545) is first weekend short-turn
  const wkndShort = allW.find((t) => t.oak === 545);
  assert.ok(wkndShort);
  assert.equal(wkndShort.short, true);

  const ev = evaluateTrain(wkndShort, allW, r17, tung, 0, 'both');
  assert.equal(ev.B.sameBusAsA, true);
  assert.equal(ev.A.dur, ev.B.dur);
  assert.deepEqual(ev.winners, ['A', 'B']);
  assert.equal(ev.C.available, true);
  if (ev.C.available) {
    assert.equal(ev.C.railWaitFed, 15);
    assert.ok(ev.C.durC > ev.A.dur);
  }
});

test('Walk mode CTLM adds 5 net minutes compared to Kafadar Commons', () => {
  const allW = buildWLine('weekday');
  const r17 = buildR17('weekday');
  const tung = buildTungsten('weekday');
  const midday = allW.find((t) => t.oak === 604)!; // 10:04 AM

  const evKaf = evaluateTrain(midday, allW, r17, tung, 0, 'kafadar');
  const evCtlm = evaluateTrain(midday, allW, r17, tung, 0, 'ctlm');

  assert.equal(evKaf.C.available, true);
  assert.equal(evCtlm.C.available, true);
  if (evKaf.C.available && evCtlm.C.available) {
    assert.equal(evCtlm.C.durC - evKaf.C.durC, 5);
  }
});

test('Hour grouping, deduplication, and summary stats match weekday schedule', () => {
  const allW = buildWLine('weekday');
  const r17 = buildR17('weekday');
  const tung = buildTungsten('weekday');
  const evaluated = allW.map((tr) => evaluateTrain(tr, allW, r17, tung, 0, 'both'));

  const stats = computeSummaryStats(evaluated);
  assert.equal(stats.total, allW.length);
  assert.equal(stats.shortCount, 4); // 6:34, 7:04, 7:34, 8:04 PM

  const hoursMap = groupByHour(evaluated);
  // 10 AM hour has 4 identical clockface trains (:04, :19, :34, :49)
  const hr10 = hoursMap.get(10)!;
  assert.equal(hr10.length, 4);
  const grouped10 = groupIdenticalInHour(hr10);
  assert.equal(grouped10.length, 1);
  assert.equal(grouped10[0].repeats.length, 4);

  // 7 PM hour has alternating short-turn and thru trains -> 2 distinct patterns
  const hr19 = hoursMap.get(19)!;
  const grouped19 = groupIdenticalInHour(hr19);
  assert.equal(grouped19.length, 2);
});
