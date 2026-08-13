import type { GameState, MatchRecord, Player, TrainingId } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, places = 0) => Number(value.toFixed(places));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

const opponents = ["オークランド・シティ", "ノースブリッジFC", "ウェストヘイヴン", "レッドフォード・アスレチック", "ポート・ヴェイル", "イーストン・ユナイテッド"];

export const trainingOptions: Record<TrainingId, { name: string; detail: string; load: number; focus: string }> = {
  finishing: { name: "フィニッシュ", detail: "決定力・シュート", load: 18, focus: "shooting" },
  passing: { name: "配球＆視野", detail: "パス・判断力", load: 14, focus: "passing" },
  dribbling: { name: "1対1", detail: "ドリブル・加速", load: 17, focus: "dribbling" },
  physical: { name: "フィジカル", detail: "体力・強度", load: 24, focus: "physical" },
  tactics: { name: "戦術理解", detail: "適合度・監督評価", load: 10, focus: "tactics" },
  recovery: { name: "リカバリー", detail: "疲労回復・負傷予防", load: -28, focus: "recovery" },
};

export function createGame(player: Player): GameState {
  return {
    version: 1, player, week: 1, date: "2026年8月10日", club: "AFCハーバー", league: "クラウン・プレミア", phase: "training",
    energy: 92, fatigue: 8, sharpness: 61, form: 68, motivation: 79, managerTrust: 55,
    rank: 3, startChance: 36, training: null, growth: 0,
    season: { appearances: 0, starts: 0, goals: 0, assists: 0, avgRating: 0 }, history: [],
    news: [{ id: 1, tag: "CLUB", text: `${player.name}がAFCハーバーとプロ契約。背番号${player.number}を選択` }],
  };
}

export function completeTraining(state: GameState, id: TrainingId): GameState {
  const t = trainingOptions[id];
  const recovery = id === "recovery";
  const nextFatigue = clamp(state.fatigue + t.load);
  const quality = clamp(72 + state.player.attributes.physical * .12 - nextFatigue * .28 + rand(-5, 5));
  const trustDelta = recovery ? (state.fatigue > 55 ? 1 : -1) : id === "tactics" ? 5 : round((quality - 55) / 12);
  const attrs = { ...state.player.attributes };
  if (!recovery && id !== "tactics") {
    const key = t.focus as keyof typeof attrs;
    attrs[key] = clamp(attrs[key] + (quality > 78 ? 1 : 0));
  }
  const trust = clamp(state.managerTrust + trustDelta);
  const sharpness = clamp(state.sharpness + (recovery ? -3 : id === "tactics" ? 5 : 8));
  const startChance = calculateStartChance({ ...state, managerTrust: trust, fatigue: nextFatigue, sharpness });
  return { ...state, player: { ...state.player, attributes: attrs }, training: id, phase: "selection", fatigue: nextFatigue,
    energy: clamp(100 - nextFatigue), sharpness, managerTrust: trust, startChance,
    news: [{ id: Date.now(), tag: "TRAINING", text: `${t.name}で評価${round(quality)}。監督の信頼 ${trustDelta >= 0 ? "+" : ""}${trustDelta}` }, ...state.news].slice(0, 8) };
}

export function calculateStartChance(s: GameState) {
  return clamp(round(s.player.overall * .55 + s.managerTrust * .36 + s.form * .22 + s.sharpness * .1 - s.fatigue * .31 - 31));
}

export function announceSelection(state: GameState): GameState {
  const rank = state.startChance >= 72 ? 1 : state.startChance >= 47 ? 2 : state.startChance >= 25 ? 3 : 4;
  return { ...state, rank, phase: "match", news: [{ id: Date.now(), tag: "TEAM", text: `次節メンバー発表：${state.startChance >= 47 ? "先発候補" : "ベンチ入り"}（${state.player.position}序列 ${rank}番手）` }, ...state.news].slice(0, 8) };
}

function positionImpact(position: string, record: MatchRecord) {
  if (["ST", "CF", "LW", "RW"].includes(position)) return record.goals * 1.25 + record.assists * .65 + record.shots * .05;
  if (["CAM", "CM", "LM", "RM", "CDM"].includes(position)) return record.assists * .9 + record.goals + (record.passPct - 75) * .018;
  return record.goals * .8 + record.assists * .5 + rand(-.15, .55);
}

export function simulateMatch(state: GameState, userBoost = 0, mode: "play" | "watch" = "watch", manual?: { goals: number; shots: number; turnovers: number; passes?: number; tackles?: number }): GameState {
  const started = Math.random() * 100 < state.startChance;
  const subbed = !started && Math.random() * 100 < clamp(48 + state.form * .2 - state.fatigue * .25);
  const minutes = started ? round(rand(68, 94)) : subbed ? round(rand(12, 34)) : 0;
  const involvement = minutes / 90 * (state.player.overall / 70) * (state.form / 70);
  const attacking = ["ST", "CF", "LW", "RW", "CAM"].includes(state.player.position);
  const goals = mode === "play" && manual ? manual.goals : minutes && Math.random() < involvement * (attacking ? .34 : .09) + userBoost * .012 ? 1 : 0;
  const assists = minutes && Math.random() < involvement * (attacking ? .25 : .16) + userBoost * .009 ? 1 : 0;
  const shots = mode === "play" && manual ? manual.shots : minutes ? round(rand(1, attacking ? 5 : 2) * minutes / 90) : 0;
  const passes = minutes ? round(rand(22, 58) * minutes / 90) : 0;
  const passPct = minutes ? round(clamp(state.player.attributes.passing + rand(8, 22), 61, 96)) : 0;
  const conceded = Math.random() < .52 ? round(rand(0, 3)) : 0;
  const scored = clamp(round(rand(0, 2.8)) + goals, 0, 5);
  const record: MatchRecord = { week: state.week, date: state.date, opponent: opponents[(state.week - 1) % opponents.length], home: scored, away: conceded,
    started, minutes, rating: 0, goals, assists, shots, passes, passPct, mode };
  record.rating = minutes ? round(clamp(6.15 + positionImpact(state.player.position, record) + userBoost * .035 - (manual?.turnovers || 0) * .06 + rand(-.35, .35), 4.5, 10), 1) : 0;
  const impact = minutes ? (record.rating - 6.2) * 5 + goals * 2 + assists : -1.5;
  const trust = clamp(state.managerTrust + round(impact));
  const appearances = state.season.appearances + (minutes ? 1 : 0);
  const avgRating = appearances ? round(((state.season.avgRating * state.season.appearances) + (minutes ? record.rating : 0)) / appearances, 2) : 0;
  const growthGain = minutes ? clamp(round((record.rating - 5.5) * 5 + state.player.potential / 28), 1, 18) : 1;
  const growth = state.growth + growthGain;
  let overall = state.player.overall;
  let remainingGrowth = growth;
  if (growth >= 100 && overall < state.player.potential) { overall += 1; remainingGrowth -= 100; }
  const form = clamp(round(state.form * .72 + (minutes ? record.rating * 10 : 58) * .28));
  const next = { ...state, player: { ...state.player, overall }, managerTrust: trust, form, fatigue: clamp(state.fatigue + minutes * .32), energy: clamp(state.energy - minutes * .28),
    sharpness: clamp(state.sharpness + (minutes ? 6 : -2)), growth: remainingGrowth, history: [record, ...state.history], phase: "training" as const,
    season: { appearances, starts: state.season.starts + (started ? 1 : 0), goals: state.season.goals + goals, assists: state.season.assists + assists, avgRating },
    news: [{ id: Date.now(), tag: "MATCH", text: `${record.opponent}戦 ${record.home}-${record.away}｜${minutes ? `${minutes}分出場・採点${record.rating}` : "出場なし"}` }, ...state.news].slice(0, 8) };
  const chance = calculateStartChance(next);
  const rank = chance >= 72 ? 1 : chance >= 47 ? 2 : chance >= 25 ? 3 : 4;
  const date = new Date(2026, 7, 10 + state.week * 7).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  return { ...next, week: state.week + 1, date, startChance: chance, rank, training: null };
}
