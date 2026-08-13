"use client";

import { useEffect, useState } from "react";
import { announceSelection, completeTraining, createGame, simulateMatch, trainingOptions } from "@/game/engine";
import { positions, type GameState, type Player, type TrainingId } from "@/game/types";
import { playerLibrary, type LibraryPlayer } from "@/game/playerLibrary";
import { acceptTransfer, generateOffers, leagues, tableFor } from "@/game/world";
import { PlayableMatch, type PlayStats } from "./PlayableMatch";
import { ConsoleHome } from "./ConsoleHome";
import { PlayerProfile } from "./PlayerProfile";

const STORAGE_KEY = "pitch-one-career-v1";
const baseAttributes = { speed: 72, shooting: 66, passing: 64, dribbling: 70, defending: 38, physical: 61 };

function Meter({ value, tone = "lime" }: { value: number; tone?: "lime" | "blue" | "orange" }) {
  return <div className="meter"><span className={tone} style={{ width: `${value}%` }} /></div>;
}

function CareerRoleSelect({ onSelect }:{ onSelect:(role:"player"|"manager")=>void }) {
  return <main className="role-shell"><div className="brand brand-dark"><span className="brand-mark">P/1</span><span>PITCH / ONE<small>CAREER SIMULATOR</small></span></div><div className="role-intro"><span className="eyebrow">CHOOSE YOUR CAREER</span><h1>ピッチに立つか。<br/><em>すべてを率いるか。</em></h1><p>キャリア開始後は変更できません。選手と監督、それぞれ独立した物語が始まります。</p></div><section className="role-cards"><button onClick={()=>onSelect("player")}><i>10</i><span>PLAYER CAREER</span><h2>選手キャリア</h2><p>1人の選手を作成し、22人が動く試合で自分だけを操作。練習、序列、移籍を勝ち抜く。</p><b>選手として始める →</b></button><button onClick={()=>onSelect("manager")}><i className="manager-icon">▦</i><span>MANAGER CAREER</span><h2>監督キャリア</h2><p>クラブを選び、スタメンと7人のサブ、戦術、交代、移籍を管理。監督席から試合を見届ける。</p><b>監督として始める →</b></button></section></main>;
}

function CreateManager({ onCreate }:{ onCreate:(state:GameState)=>void }) {
  const [name,setName]=useState("黒田 司"); const [club,setClub]=useState("AFCハーバー"); const selectedLeague=leagues.find(l=>l.clubs.includes(club))||leagues[0];
  const start=(e:React.FormEvent)=>{e.preventDefault();const captain:Player={name:"アレックス・カーター",nationality:"イングランド",age:24,height:183,weight:78,foot:"右",position:"CM",secondary:"CDM",number:8,style:"ボックス・トゥ・ボックス",overall:74,potential:81,attributes:{speed:72,shooting:68,passing:78,dribbling:74,defending:69,physical:76}};onCreate({...createGame(captain),careerRole:"manager",managerName:name,club,league:selectedLeague.name,managerTrust:75,rank:1,startChance:100})};
  return <main className="manager-create"><div className="brand brand-dark"><span className="brand-mark">P/1</span><span>PITCH / ONE<small>MANAGER CAREER</small></span></div><form onSubmit={start}><span className="eyebrow">MANAGER PROFILE</span><h1>あなたの哲学を、<br/>クラブの未来に。</h1><label>監督名<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>最初のクラブ<select value={club} onChange={e=>setClub(e.target.value)}>{leagues.map(l=><optgroup label={`${l.name} · ${l.nation}`} key={l.id}>{l.clubs.map(c=><option key={c}>{c}</option>)}</optgroup>)}</select></label><div className="manager-summary"><span>LEAGUE<b>{selectedLeague.name}</b></span><span>LEVEL<b>{selectedLeague.level}</b></span><span>SQUAD<b>25 PLAYERS</b></span><span>FORMATION<b>4-3-3</b></span></div><button className="primary">{club}の監督に就任する →</button></form></main>;
}

function CreatePlayer({ onCreate }: { onCreate: (p: Player) => void }) {
  const [form, setForm] = useState<Player & { photo: string }>({ name: "蒼井 蓮", nationality: "日本", age: 17, height: 178, weight: 69, foot: "右", position: "ST", secondary: "RW", number: 27, style: "ラインブレイカー", photo: "", source: "original", overall: 67, potential: 88, attributes: baseAttributes });
  const [mode, setMode] = useState<"original" | "library">("original");
  const [libraryType, setLibraryType] = useState<"current" | "legend">("current");
  const submit = (e: React.FormEvent) => { e.preventDefault(); onCreate(form); };
  const choosePlayer = (p: LibraryPlayer) => { const { era: _era, accent: _accent, ...selected } = p; setForm({ ...selected, photo: form.photo || "" }); };
  const readPhoto = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const canvas = document.createElement("canvas"); const size = 360; canvas.width = size; canvas.height = size; const ctx = canvas.getContext("2d"); if (!ctx) return; const scale = Math.max(size / image.width, size / image.height); const w = image.width * scale, h = image.height * scale; ctx.drawImage(image, (size-w)/2, (size-h)/2, w, h); setForm(current => ({ ...current, photo: canvas.toDataURL("image/jpeg", .78) })); }; image.src = String(reader.result); }; reader.readAsDataURL(file);
  };
  return <main className="creator-shell">
    <div className="brand brand-dark"><span className="brand-mark">P/1</span><span>PITCH / ONE<small>CAREER SIMULATOR</small></span></div>
    <section className="creator-card">
      <div className="creator-intro"><span className="eyebrow">NEW CAREER · 01</span><h1>その名前が、<br/><em>物語になる。</em></h1><p>オリジナル選手でも、憧れの選手の若き日でも。写真を加えて、あなただけのキャリアを始めよう。</p>{form.photo ? <img className="portrait-preview" src={form.photo} alt="選手写真プレビュー"/> : <div className="shirt"><span>{form.number}</span><strong>{form.position}</strong></div>}</div>
      <form onSubmit={submit} className="creator-form"><div className="form-head"><span>PLAYER PROFILE</span><b>{mode === "original" ? "CREATE" : "PLAYER LIBRARY"}</b></div>
        <div className="creator-tabs wide"><button type="button" className={mode === "original" ? "active" : ""} onClick={() => setMode("original")}>オリジナル選手</button><button type="button" className={mode === "library" ? "active" : ""} onClick={() => setMode("library")}>実在・往年選手</button></div>
        {mode === "library" && <div className="library-panel wide"><div className="library-filter"><button type="button" className={libraryType === "current" ? "active" : ""} onClick={() => setLibraryType("current")}>現役スター</button><button type="button" className={libraryType === "legend" ? "active" : ""} onClick={() => setLibraryType("legend")}>往年のレジェンド</button></div><div className="player-library">{playerLibrary.filter(p => p.source === libraryType).map(p => <button type="button" key={p.name} className={form.name === p.name ? "selected" : ""} onClick={() => choosePlayer(p)} style={{ "--player-accent": p.accent } as React.CSSProperties}><i>{p.number}</i><span><b>{p.name}</b><small>{p.era} · {p.position} · OVR {p.overall}</small></span></button>)}</div><p className="library-note">能力値は若手時代をイメージしたゲーム用データです。所属クラブや公式写真は含まれません。</p></div>}
        <label className="wide photo-upload"><span>選手写真（任意）</span><div>{form.photo ? <img src={form.photo} alt="アップロード済みの選手写真"/> : <i>＋</i>}<p><b>{form.photo ? "写真を変更" : "写真を選択"}</b><small>JPG / PNG · 正方形に自動調整 · この端末にのみ保存</small></p><input aria-label="選手写真を選択" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => readPhoto(e.target.files?.[0])}/>{form.photo && <button type="button" onClick={() => setForm({ ...form, photo: "" })}>削除</button>}</div></label>
        <label className="wide">選手名<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label>国籍<input required value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}/></label>
        <label>年齢<input type="number" min="15" max="38" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })}/></label>
        <label>身長 (cm)<input type="number" value={form.height} onChange={e => setForm({ ...form, height: +e.target.value })}/></label>
        <label>体重 (kg)<input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: +e.target.value })}/></label>
        <label>利き足<select value={form.foot} onChange={e => setForm({ ...form, foot: e.target.value as "右" | "左" })}><option>右</option><option>左</option></select></label>
        <label>背番号<input type="number" min="1" max="99" value={form.number} onChange={e => setForm({ ...form, number: +e.target.value })}/></label>
        <label>メインポジション<select value={form.position} onChange={e => setForm({ ...form, position: e.target.value as typeof form.position })}>{positions.map(p => <option key={p}>{p}</option>)}</select></label>
        <label>サブポジション<select value={form.secondary} onChange={e => setForm({ ...form, secondary: e.target.value as typeof form.secondary })}>{positions.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="wide">プレースタイル<select value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}><option>ラインブレイカー</option><option>チャンスメイカー</option><option>ボックス・トゥ・ボックス</option><option>ボールハンター</option><option>空中戦の支配者</option></select></label>
        <div className="rating-preview wide"><span>STARTING PROFILE</span>{Object.entries(form.attributes).map(([key,value]) => <b key={key}>{key.slice(0,3).toUpperCase()}<em>{value}</em></b>)}<strong>OVR {form.overall} / POT {form.potential}</strong></div>
        <button className="primary wide">{form.name}でキャリアを始める <span>→</span></button>
      </form>
    </section>
  </main>;
}

function LeagueHub({ game }: { game: GameState }) {
  const rows = tableFor(game.league || "クラウン・プレミア", game.club, game.week);
  return <section className="hub-view"><div className="hub-title"><div><span className="eyebrow">WORLD FOOTBALL</span><h2>リーグセンター</h2><p>6カ国・36クラブの成績と勢力図がシーズン進行に連動します。</p></div><b>{game.league || "クラウン・プレミア"}</b></div><div className="league-layout"><div className="league-tabs">{leagues.map(l => <button className={l.name === (game.league || "クラウン・プレミア") ? "active" : ""} key={l.id}><i>{l.level}</i><span>{l.name}<small>{l.nation}</small></span></button>)}</div><div className="league-table"><div className="table-head"><span>#</span><b>CLUB</b><span>PL</span><span>GD</span><span>PTS</span></div>{rows.map(row => <div className={row.own ? "own" : ""} key={row.name}><span>{row.position}</span><b><i>{row.name.slice(0,2)}</i>{row.name}</b><span>{row.played}</span><span>{row.gd > 0 ? `+${row.gd}` : row.gd}</span><strong>{row.points}</strong></div>)}</div></div></section>;
}

function TransferHub({ game, onGame }: { game: GameState; onGame: (game: GameState) => void }) {
  const offers = game.transferOffers || [];
  const money = (n: number) => `€${(n / 1000000).toFixed(1)}M`;
  return <section className="hub-view transfer-hub"><div className="hub-title"><div><span className="eyebrow">ACTIVE MARKET · SUMMER WINDOW</span><h2>移籍市場</h2><p>能力、ポテンシャル、フォーム、リーグ水準から現実的なオファーを生成します。</p></div><div className="market-status"><i/>市場 OPEN<small>残り 21日</small></div></div><div className="market-profile"><div><span>{game.player.position}</span><h3>{game.player.name}</h3><small>{game.club} · OVR {game.player.overall} · POT {game.player.potential}</small></div><button className="primary" onClick={() => onGame({ ...game, transferOffers: generateOffers(game), news: [{ id: Date.now(), tag: "AGENT", text: "代理人が各国クラブへ移籍可能性を照会" }, ...game.news] })}>代理人にオファーを探させる →</button></div>{offers.length ? <div className="offer-list">{offers.map(offer => <article key={offer.id}><div className="offer-club"><i>{offer.club.slice(0,2)}</i><div><span>{offer.league}</span><h3>{offer.club}</h3><small>{offer.style} · クラブ水準 {offer.rating}</small></div></div><div className="offer-terms"><span>移籍金<b>{money(offer.fee)}</b></span><span>週給<b>€{offer.weeklyWage.toLocaleString()}</b></span><span>契約<b>{offer.years}年</b></span><span>役割<b>{offer.role}</b></span></div><button onClick={() => { if (confirm(`${offer.club}への移籍を承諾しますか？`)) onGame(acceptTransfer(game, offer)); }}>オファーを確認・承諾 →</button></article>)}</div> : <div className="empty-market"><b>NO ACTIVE OFFERS</b><p>代理人に依頼すると、現在の評価に合ったクラブから最大4件のオファーが届きます。</p></div>}<div className="fc-note"><b>CAREER DESIGN</b><p>FC 26の「変化し続ける監督市場」「予想外のイベント」「アーキタイプ」に着想を得て、今後は監督交代と戦術変化もこの市場へ接続します。</p></div></section>;
}

export function CareerGame() {
  const [game, setGame] = useState<GameState | null>(null); const [loaded, setLoaded] = useState(false); const [tab, setTab] = useState("ホーム");
  const [roleChoice,setRoleChoice]=useState<"player"|"manager"|null>(null);
  const [matchMode, setMatchMode] = useState<"choose" | "play" | "watch">("choose");
  useEffect(() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { try { setGame(JSON.parse(saved)); } catch {} } setLoaded(true); }, []);
  useEffect(() => { if (game && loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }, [game, loaded]);
  if (!loaded) return <div className="loading">PITCH / ONE</div>;
  if (!game && !roleChoice) return <CareerRoleSelect onSelect={setRoleChoice}/>;
  if (!game && roleChoice === "manager") return <CreateManager onCreate={setGame}/>;
  if (!game) return <CreatePlayer onCreate={p => setGame({...createGame(p),careerRole:"player"})}/>;
  const last = game.history[0]; const nextOpponent = ["オークランド・シティ", "ノースブリッジFC", "ウェストヘイヴン", "レッドフォード・アスレチック", "ポート・ヴェイル", "イーストン・ユナイテッド"][(game.week - 1) % 6];
  const selectTraining = (id: TrainingId) => setGame(completeTraining(game, id));
  const finishMatch = (mode: "play" | "watch", manual?: PlayStats) => { const boost = manual ? manual.goals * 8 + manual.shots + manual.passes * .15 + manual.tackles * .5 - manual.turnovers : 0; setGame(simulateMatch(game, boost, mode, manual)); setMatchMode("choose"); };
  return <div className="app-shell">
    <header><div className="brand"><span className="brand-mark">P/1</span><span>PITCH / ONE<small>{game.careerRole === "manager" ? "MANAGER CAREER" : "PLAYER CAREER"}</small></span></div><div className="season">20<span>26</span> / 27<small>SEASON</small></div><button className="profile" aria-label="プロフィール"><span>{game.careerRole === "manager" ? "M" : game.player.number}</span>{game.careerRole === "manager" ? game.managerName : game.player.name}</button></header>
    <aside><nav>{["ホーム", "スケジュール", "試合", "練習", "選手", "クラブ", "リーグ", "移籍", "契約", "ニュース", "キャリア記録"].map((n, i) => <button className={tab === n ? "active" : ""} onClick={() => setTab(n)} key={n}><span>{["⌂","□","◉","↗","◇","⬟","≡","⇄","▣","●","↻"][i]}</span>{n}</button>)}</nav><div className="save-note"><i/>自動セーブ済み<small>この端末に保存</small></div></aside>
    <main className="dashboard"><div className="topline"><div><span className="eyebrow">WEEK {String(game.week).padStart(2,"0")} · PRE-MATCH</span><h1>おかえりなさい、<em>{game.player.name.split(" ")[0]}。</em></h1><p>{game.date}　土曜日</p></div><div className="phase"><span className={game.phase === "training" ? "now" : "done"}>1<small>TRAINING</small></span><i/><span className={game.phase === "selection" ? "now" : game.phase === "match" ? "done" : ""}>2<small>SELECTION</small></span><i/><span className={game.phase === "match" ? "now" : ""}>3<small>MATCHDAY</small></span></div></div>
      {tab === "ホーム" && <ConsoleHome game={game} onGame={setGame} nextOpponent={nextOpponent} matchMode={matchMode} setMatchMode={setMatchMode} onFinish={finishMatch} onTab={setTab}/>} 
      {tab === "__legacy" && <><section className="hero-grid">
        <article className="next-match"><div className="card-label">NEXT MATCH <b>リーグ第{game.week}節</b></div><div className="fixture"><div><span className="crest home">AH</span><strong>AFCハーバー</strong><small>HOME</small></div><div className="versus"><span>4日後</span><b>VS</b><small>8月{14 + game.week * 7}日 19:30</small></div><div><span className="crest away">{nextOpponent.slice(0,2)}</span><strong>{nextOpponent}</strong><small>AWAY</small></div></div><div className="venue">ハーバー・パーク　·　天候 晴れ 24°C</div></article>
        <article className="status-card"><div className="player-line">{game.player.photo ? <img className="avatar photo" src={game.player.photo} alt={`${game.player.name}の選手写真`}/> : <div className="avatar">{game.player.number}</div>}<div><span>{game.player.position} · {game.player.number} {game.player.source === "legend" ? "· LEGEND" : ""}</span><h2>{game.player.name}</h2><small>{game.player.age}歳 · {game.player.height}cm · {game.player.foot}利き</small></div><div className="ovr"><b>{game.player.overall}</b><span>OVR</span></div></div><div className="status-meters"><div><span>体力 <b>{game.energy}</b></span><Meter value={game.energy}/></div><div><span>コンディション <b>{game.form}</b></span><Meter value={game.form} tone="blue"/></div><div><span>試合勘 <b>{game.sharpness}</b></span><Meter value={game.sharpness} tone="orange"/></div></div></article>
      </section>
      <section className="metrics">
        <article><span>監督評価 <b>{game.managerTrust >= 70 ? "GOOD" : "DEVELOPING"}</b></span><strong>{game.managerTrust}<small>/100</small></strong><Meter value={game.managerTrust}/><p>{game.managerTrust >= 65 ? "信頼を得ています" : "練習でアピールが必要"}</p></article>
        <article><span>クラブ内序列 <b>{game.player.position}</b></span><strong>{game.rank}<small>番手</small></strong><div className="rank-dots">{[1,2,3,4].map(n => <i className={n === game.rank ? "selected" : ""} key={n}>{n}</i>)}</div></article>
        <article><span>次節 先発確率</span><strong>{game.startChance}<small>%</small></strong><Meter value={game.startChance} tone="blue"/><p>{game.startChance >= 50 ? "先発争いで優勢" : "ベンチスタート予想"}</p></article>
        <article><span>今季成績 <b>{game.season.appearances} APPS</b></span><div className="season-stats"><b>{game.season.goals}<small>GOALS</small></b><b>{game.season.assists}<small>ASSISTS</small></b><b>{game.season.avgRating || "—"}<small>RATING</small></b></div><p>{game.season.starts}先発 · {game.season.appearances - game.season.starts}途中出場</p></article>
      </section>
      <section className="content-grid"><article className="action-card"><div className="section-head"><div><span className="eyebrow">THIS WEEK</span><h2>{game.phase === "training" ? "トレーニングを選択" : game.phase === "selection" ? "メンバー発表" : "MATCHDAY"}</h2></div><small>疲労 {game.fatigue}%</small></div>
        {game.phase === "training" && <div className="training-grid">{Object.entries(trainingOptions).map(([id,t]) => <button onClick={() => selectTraining(id as TrainingId)} key={id}><span>{t.name}</span><small>{t.detail}</small><b className={t.load < 0 ? "recover" : ""}>{t.load > 0 ? `負荷 +${t.load}` : `疲労 ${t.load}`}</b></button>)}</div>}
        {game.phase === "selection" && <div className="decision"><span className="decision-num">{game.startChance}%</span><div><h3>選考会議の準備が整いました</h3><p>監督評価、戦術適性、直近のフォーム、疲労をもとに次節メンバーを決定します。</p></div><button className="primary" onClick={() => setGame(announceSelection(game))}>メンバー発表を見る →</button></div>}
        {game.phase === "match" && matchMode === "choose" && <div className="match-modes">{game.careerRole !== "manager" && <button onClick={() => setMatchMode("play")}><i>10</i><span><b>選手としてプレイ</b><small>22人の中で自分の選手だけを操作する</small></span><em>PLAY</em></button>}<button onClick={() => setMatchMode("watch")}><i className="coach">▦</i><span><b>監督目線で観戦</b><small>スタメン11人とサブ7人の起用・交代を見届ける</small></span><em>WATCH</em></button></div>}
        {game.phase === "match" && matchMode === "play" && <PlayableMatch number={game.player.number} opponent={nextOpponent} onFinish={stats => finishMatch("play", stats)} onBack={() => setMatchMode("choose")}/>} 
        {game.phase === "match" && matchMode === "watch" && <div className="watch-match"><div className="tactics-board"><div className="halfway"/><span className="ball">●</span>{[1,2,3,4,5,6,7,8,9,10,11].map(n => <i key={n} style={{ left: `${15 + (n%4)*21}%`, top: `${12 + Math.floor(n/4)*28}%` }}>{n}</i>)}</div><div><span className="eyebrow">MANAGER VIEW · 4-3-3</span><h3>監督席から試合を観戦</h3><p>疲労、フォーム、戦術適性をもとに起用と交代を自動判断します。試合終了後に詳細採点を確認できます。</p><button className="primary" onClick={() => finishMatch("watch")}>キックオフして観戦 →</button><button className="text-button" onClick={() => setMatchMode("choose")}>モード選択へ戻る</button></div></div>}
        <div className="growth"><span>次の能力アップまで</span><Meter value={game.growth}/><b>{game.growth}/100</b></div>
      </article><article className="news-card"><div className="section-head"><div><span className="eyebrow">LIVE FEED</span><h2>クラブニュース</h2></div><button onClick={() => setTab("ニュース")}>すべて見る</button></div><div className="news-list">{game.news.slice(0,4).map(n => <div key={n.id}><span>{n.tag}</span><p>{n.text}</p><small>たった今</small></div>)}</div></article></section>
      {last && <section className="last-result"><span>LAST MATCH</span><b>{last.opponent}戦　{last.home} — {last.away}</b><p>{last.minutes ? `${last.minutes}分 · 採点 ${last.rating} · ${last.goals}ゴール ${last.assists}アシスト · ${last.mode === "play" ? "選手操作" : "観戦"}` : "出場なし"}</p></section>}</>}
      {tab === "リーグ" && <LeagueHub game={game}/>} 
      {tab === "移籍" && <TransferHub game={game} onGame={setGame}/>} 
      {tab === "選手" && <PlayerProfile game={game}/>} 
      {tab !== "ホーム" && tab !== "リーグ" && tab !== "移籍" && tab !== "選手" && <section className="placeholder-view"><span className="eyebrow">CAREER HUB</span><h2>{tab}</h2><p>このセクションはキャリアの進行にあわせて更新されます。ホーム、選手、リーグ、移籍市場は現在操作できます。</p></section>}
      <button className="reset" onClick={() => { if(confirm("このキャリアを削除してキャリア選択に戻りますか？")){ localStorage.removeItem(STORAGE_KEY); setGame(null); setRoleChoice(null); }}}>キャリアをリセット</button>
    </main>
  </div>;
}
