export type AiDifficulty = "EASY" | "NORMAL" | "HARD" | "EXPERT";
export type AttackPlan = "POSSESSION" | "COUNTER" | "WIDE_CROSS" | "THIRD_RUN" | "LONG_BALL" | "SLOW_BUILD" | "SET_PIECE";
export type DefensePlan = "HIGH_PRESS" | "MID_BLOCK" | "LOW_BLOCK" | "WIDE_TRAP" | "CENTRAL_LOCK" | "MAN_MARK" | "TIME_MANAGE";

export type AiContext = { minute:number; scoreDiff:number; stamina:number; possession:number; home:boolean; style?:"possession"|"direct"|"counter" };
const hash=(n:number)=>{const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x)};

export function chooseAttackPlan(c:AiContext):AttackPlan {
  if(c.minute>76 && c.scoreDiff<0)return hash(c.minute+4)<.5?"COUNTER":"WIDE_CROSS";
  if(c.minute>78 && c.scoreDiff>0)return "SLOW_BUILD";
  if(c.style==="counter")return hash(c.minute+11)<.65?"COUNTER":"LONG_BALL";
  if(c.style==="direct")return hash(c.minute+7)<.55?"LONG_BALL":"WIDE_CROSS";
  const plans:AttackPlan[]=["POSSESSION","WIDE_CROSS","THIRD_RUN","SLOW_BUILD","SET_PIECE"];
  return plans[Math.floor(hash(c.minute*3+c.possession)*plans.length)];
}

export function chooseDefensePlan(c:AiContext):DefensePlan {
  if(c.minute>76 && c.scoreDiff>0)return "TIME_MANAGE";
  if(c.minute>70 && c.scoreDiff<0)return "HIGH_PRESS";
  if(c.stamina<42)return "LOW_BLOCK";
  if(c.possession<43)return hash(c.minute+19)<.5?"WIDE_TRAP":"CENTRAL_LOCK";
  const plans:DefensePlan[]=["HIGH_PRESS","MID_BLOCK","WIDE_TRAP","CENTRAL_LOCK","MAN_MARK"];
  return plans[Math.floor(hash(c.minute*5+c.stamina)*plans.length)];
}

export function decisionReason(attack:AttackPlan, defense:DefensePlan, c:AiContext){
  return `attack=${attack} defense=${defense} minute=${c.minute} scoreDiff=${c.scoreDiff} stamina=${Math.round(c.stamina)}`;
}
