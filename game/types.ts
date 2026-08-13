export const positions = ["GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST"] as const;
export type Position = (typeof positions)[number];
export type TrainingId = "finishing" | "passing" | "dribbling" | "physical" | "tactics" | "recovery";

export type Player = {
  name: string; nationality: string; age: number; height: number; weight: number;
  foot: "右" | "左"; position: Position; secondary: Position; number: number; style: string;
  overall: number; potential: number;
  photo?: string; source?: "original" | "current" | "legend";
  attributes: { speed: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
};

export type MatchRecord = {
  week: number; date: string; opponent: string; home: number; away: number; started: boolean;
  minutes: number; rating: number; goals: number; assists: number; shots: number; passes: number; passPct: number;
  mode?: "play" | "watch";
};

export type TransferOffer = { id: string; club: string; league: string; role: string; fee: number; weeklyWage: number; years: number; rating: number; style: string };

export type GameState = {
  version: 1; player: Player; week: number; date: string; club: string; phase: "training" | "selection" | "match";
  energy: number; fatigue: number; sharpness: number; form: number; motivation: number; managerTrust: number;
  rank: number; startChance: number; training: TrainingId | null; growth: number;
  season: { appearances: number; starts: number; goals: number; assists: number; avgRating: number };
  history: MatchRecord[]; news: { id: number; text: string; tag: string }[];
  league?: string; transferOffers?: TransferOffer[];
  careerRole?: "player" | "manager"; managerName?: string;
};
