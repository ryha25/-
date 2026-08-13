import type { GameState, TransferOffer } from "./types";

export const leagues = [
  { id: "crown", name: "クラウン・プレミア", nation: "イングランド相当", level: 88, clubs: ["AFCハーバー", "ノースブリッジFC", "ウェストヘイヴン", "レッドフォード・アスレチック", "ロイヤル・ロンドン", "マージー・ブルー"] },
  { id: "iberia", name: "イベリア・プリメーラ", nation: "スペイン相当", level: 87, clubs: ["マドリード・レアル", "カタルーニャSC", "バレンシア・オレンジ", "セビージャ・ロホ", "バスク・アスレティック", "ビジャレアル・イエロー"] },
  { id: "calcio", name: "レガ・カルチョ", nation: "イタリア相当", level: 85, clubs: ["ミラノ・ロッソ", "インテルナ・ミラノ", "トリノ・ビアンコ", "ローマ・ルピ", "ナポリ・アッズーリ", "フィレンツェ・ヴィオラ"] },
  { id: "rhein", name: "ライン・ブンデス", nation: "ドイツ相当", level: 84, clubs: ["ミュンヘン・ロート", "ドルトムント・ゲルブ", "レーヴァークーゼン04", "ライプツィヒRB", "フランクフルト・アドラー", "シュトゥットガルト1893"] },
  { id: "hexagon", name: "リーグ・エグザゴン", nation: "フランス相当", level: 82, clubs: ["パリ・エトワール", "マルセイユ・オランピック", "モナコ・ルージュ", "リヨン・ローヌ", "リール・ドーグ", "ニース・アズール"] },
  { id: "sakura", name: "サクラ Jリーグ", nation: "日本相当", level: 74, clubs: ["東京ヴェルデFC", "横浜マリナーズ", "大阪セレッソ", "神戸ハーバーズ", "浦和レッドウイング", "鹿島ディアーズ"] },
];

const roles = ["重要選手", "レギュラー", "ローテーション", "将来有望"];

export function generateOffers(state: GameState): TransferOffer[] {
  const playerValue = Math.round((state.player.overall ** 3) * (state.player.potential / 100) * 95);
  const eligible = leagues.flatMap(league => league.clubs.filter(club => club !== state.club).map(club => ({ league, club }))).filter(({ league }) => state.player.overall + 16 >= league.level);
  return eligible.sort(() => Math.random() - .5).slice(0, 4).map(({ league, club }, index) => ({
    id: `${state.week}-${index}-${club}`, club, league: league.name,
    role: roles[Math.min(3, Math.max(0, Math.floor((league.level - state.player.overall + 5) / 7)))],
    fee: Math.round(playerValue * (.82 + Math.random() * .42) / 100000) * 100000,
    weeklyWage: Math.round((state.player.overall ** 2.6) * (1.1 + Math.random()) / 100) * 100,
    years: 3 + Math.floor(Math.random() * 3), rating: league.level, style: ["ポゼッション", "ハイプレス", "カウンター", "堅守速攻"][index % 4],
  }));
}

export function acceptTransfer(state: GameState, offer: TransferOffer): GameState {
  return { ...state, club: offer.club, league: offer.league, transferOffers: [], managerTrust: 48, rank: offer.role === "重要選手" ? 1 : offer.role === "レギュラー" ? 2 : 3, startChance: offer.role === "重要選手" ? 72 : offer.role === "レギュラー" ? 56 : 35,
    news: [{ id: Date.now(), tag: "TRANSFER", text: `${state.player.name}が${offer.club}へ完全移籍。${offer.years}年契約に合意` }, ...state.news].slice(0, 8) };
}

export function tableFor(leagueName: string, club: string, week: number) {
  const league = leagues.find(l => l.name === leagueName) ?? leagues[0];
  return league.clubs.map((name, i) => ({ name, played: Math.max(0, week - 1), points: Math.max(0, (week - 1) * 2 + ((i * 7 + week * 3) % 8) - i), gd: 9 - i * 2 })).sort((a,b) => b.points - a.points).map((row, i) => ({ ...row, position: i + 1, own: row.name === club }));
}
