// ES-modules, динамическая загрузка i18n / words / rules
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const $ = (id)=>document.getElementById(id);
const SUPPORTED = ['ru','de','pl','en'];

// --- i18n core ---
const i18n = { lang:'ru', dict:{}, t(key, fb = '', params){
  try {
    let s = (this.dict && this.dict[key]) || (fb || key);
    if (params) for (const [k,v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  } catch { return fb || key; }
}};
window.i18n = i18n;
const tt = (k,fb,p)=>i18n.t(k,fb,p);
const safeLang = ()=> (typeof i18n.lang==='string' ? i18n.lang : getLang());

// --- words cache ---
const wordsCache = new Map();
async function loadWords(lang){
  if (!SUPPORTED.includes(lang)) lang='ru';
  if (wordsCache.has(lang)) return wordsCache.get(lang);
  const mod = await import(`./words/${lang}.js`);
  const dict = mod.default || {};
  wordsCache.set(lang, dict);
  return dict;
}
async function getCategories(lang){
  const W = await loadWords(lang);
  return Object.keys(W);
}
async function randomWord(lang, category){
  const W = await loadWords(lang);
  const list = W[category] || [];
  return list[Math.floor(Math.random()*list.length)] || '';
}

// --- utils ---
function getLang(){
  const el = document.getElementById('langSelect');
  const v = el && el.value ? el.value : (typeof localStorage!=='undefined' && localStorage.getItem('lang'));
  return SUPPORTED.includes(v) ? v : 'ru';
}
function pruneUndefined(obj){
  if (!obj || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach(k=>{
    const v = obj[k];
    if (v === undefined) delete obj[k];
    else if (v && typeof v === 'object') pruneUndefined(v);
  });
  return obj;
}
function applyI18nToDom() {
  document.documentElement.lang = i18n.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const txt = i18n.t(key);
    if (!attr) el.textContent = txt; else el.setAttribute(attr, txt);
  });
  setRoomHeader();
}
function escapeHtml(str){ return (str??"").toString().replace(/[&<>"']/g, s=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s])); }
function fmt2(n){ return n<10 ? "0"+n : ""+n; }

const screens = { auth:$("screen-auth"), lobby:$("screen-lobby"), round:$("screen-round") };
function showScreen(key){ for(const k in screens) screens[k].style.display = (k===key) ? "" : "none"; }
function setStatus(text){ $("status").textContent = text; }
let roomCode = null;
function setRoomHeader(){ $("roomHeader").textContent = tt('room_label','Комната: {code}').replace('{code}', roomCode ?? '—'); }

// --- timer ---
let timerInterval = null;
function startLocalTimer(endTs, onElapsed){
  stopLocalTimer();
  const tick = ()=>{
    const now = Date.now();
    const left = Math.max(0, Math.floor((endTs - now)/1000));
    const mm = Math.floor(left/60), ss = left % 60;
    $("timerBox").textContent = `${fmt2(mm)}:${fmt2(ss)}`;
    if (left<=0) { stopLocalTimer(); onElapsed && onElapsed(); }
  };
  tick(); timerInterval = setInterval(tick, 250);
}
function stopLocalTimer(){ if (timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

// --- state ---
const ROUND_SECONDS = 120;
const state = { category:null };
let appFB = null, db = null, auth = null;
let me = { uid:null, name:null };
let roomSnap = null, unsubRoom = null, pinnedView=null;
function pinLobby(ms=15000){ pinnedView = "lobby"; setTimeout(()=>{ pinnedView=null; }, ms); }

// --- lang loading ---
async function loadLang(lang){
  if (!SUPPORTED.includes(lang)) lang='ru';
  try{
    const mod = await import(`./i18n/${lang}.js`);
    i18n.lang = lang;
    i18n.dict = mod.default || {};
    try{ localStorage.setItem('lang', lang); }catch{}
    applyI18nToDom();
    await populateCategories();
    const bd = document.querySelector('.modal-backdrop');
    if (bd && bd.style.display === 'flex') openRules();
  }catch(e){ console.error('i18n load error', e); }
}

// --- init ---
async function init() {
  const saved = localStorage.getItem('lang');
  const browser = (navigator.language||'ru').slice(0,2);
  const startLang = SUPPORTED.includes(saved||'') ? saved : (SUPPORTED.includes(browser) ? browser : 'ru');
  $("langSelect").value = startLang;
  try { localStorage.setItem('lang', startLang); } catch(e) {}
  wireUiHandlers();
  await loadLang(startLang);

  appFB = initializeApp(firebaseConfig);
  db = getDatabase(appFB);
  auth = getAuth(appFB);
  onAuthStateChanged(auth, (user)=>{ if (user) me.uid = user.uid; });
  try { await signInAnonymously(auth); } catch(e) { console.error('Anon auth failed', e); }

  await populateCategories();

  if (location.hash) $("joinCode").value = location.hash.replace("#","").toUpperCase();
  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#","").trim().toUpperCase();
    if (h && !roomCode) $("joinCode").value = h;
  });
}

function wireUiHandlers(){
  $("langSelect").addEventListener('change', (e)=> {
    try{ localStorage.setItem('lang', e.target.value); }catch(_){}
    loadLang(e.target.value);
  });
  $("rulesBtn")?.addEventListener('click', openRules);
  $("rulesBtnRound")?.addEventListener('click', openRules);
  $("rulesBtnRoundLobby")?.addEventListener('click', openRules);

  $("createRoomBtn").addEventListener('click', async ()=>{
    const name = ($("nickname").value||"").trim();
    if (!name) return setStatus(i18n.lang==='de'?'Gib einen Namen ein.':i18n.lang==='pl'?'Podaj nick.':i18n.lang==='en'?'Enter a nickname.':'Укажи ник.');
    me.name = name;
    state.category = $("category").value;
    roomCode = await createRoom(me.uid, state.category);
    setRoomHeader();
    await joinAsPlayer(roomCode, me);
    showLobby();
  });

  $("joinRoomBtn").addEventListener('click', async ()=>{
    const name = ($("nickname").value||"").trim();
    if (!name) return setStatus(i18n.lang==='de'?'Gib einen Namen ein.':i18n.lang==='pl'?'Podaj nick.':i18n.lang==='en'?'Enter a nickname.':'Укажи ник.');
    me.name = name;
    const code = ($("joinCode").value||"").trim().toUpperCase();
    if (!code || code.length<4) return setStatus(i18n.lang==='de'?'Code eingeben (4 Zeichen)':i18n.lang==='pl'?'Podaj kod (4 znaki)':i18n.lang==='en'?'Enter code (4 chars)':'Введите код (4 символа)');
    const exists = await roomExists(code);
    if (!exists) return setStatus(i18n.lang==='de'?'Raum nicht gefunden':i18n.lang==='pl'?'Nie znaleziono pokoju':i18n.lang==='en'?'Room not found':'Комната не найдена');
    roomCode = code; setRoomHeader();
    await joinAsPlayer(roomCode, me);
    showLobby();
  });

  $("copyCodeBtn").addEventListener('click', ()=>{
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setStatus((i18n.lang==='de'?'Code kopiert: ':i18n.lang==='en'?'Code copied: ':'Код скопирован: ')+roomCode);
  });
  $("copyLinkBtn").addEventListener('click', ()=>{
    if (!roomCode) return;
    const url = location.origin + location.pathname + "#" + roomCode;
    navigator.clipboard.writeText(url);
    setStatus(i18n.lang==='de'?'Einladungslink kopiert':i18n.lang==='pl'?'Link zaproszenia skopiowany':i18n.lang==='en'?'Invite link copied':'Ссылка скопирована');
  });

  $("leaveRoomBtn").addEventListener('click', leaveRoom);
  $("startGameBtn").addEventListener('click', async ()=>{
    const room = roomSnap?.val(); 
    if (!room) return;
    const amHost = room.host === me.uid || !room.host;
    if (!amHost) return setStatus(i18n.lang==='de'?'Nur der Host kann starten':i18n.lang==='pl'?'Tylko host może startować':i18n.lang==='en'?'Only host can start':'Только хост может начать');
    const players = room.players ? Object.values(room.players).filter(p=>!p.left) : [];
    if (players.length < 2) return setStatus(i18n.lang==='de'?'Mindestens 2 Spieler':i18n.lang==='pl'?'Minimum 2 graczy':i18n.lang==='en'?'At least 2 players':'Нужно минимум 2 игрока');
    await startOrNextRound(room, players);
  });

  $("exitToLobbyBtn").addEventListener('click', ()=>{ pinLobby(); showLobby(); });
  $("revealBtn").addEventListener('click', async ()=>{
    const room = roomSnap?.val();
    if (!room) return;
    if (room.phase !== "vote") {
      await update(ref(db, `rooms/${roomCode}`), { phase:"vote", votes:null, result:null });
    }
  });
  $("nextRoundBtn").addEventListener('click', async ()=>{
    const room = roomSnap?.val();
    if (!room) return;
    const players = room.players ? Object.values(room.players).filter(p=>!p.left) : [];
    if (players.length<2) return;
    await startOrNextRound(room, players);
  });
}

async function populateCategories(){
  const sel = $("category"); if (!sel) return;
  sel.innerHTML = "";
  const cats = await getCategories(i18n.lang);
  cats.forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k; sel.appendChild(o); });
  if (!state.category || !cats.includes(state.category)) state.category = cats[0];
  sel.value = state.category;
}

function showLobby(){
  showScreen("lobby");
  setStatus(i18n.lang==='de'?'Im Lobby':i18n.lang==='pl'?'W lobby':i18n.lang==='en'?'In lobby':'В лобби');
  if (unsubRoom) unsubRoom();
  unsubRoom = onValue(ref(db, `rooms/${roomCode}`), (snap)=>{
    roomSnap = snap;
    const room = snap.val() || {};

    if (room.lang && room.lang !== i18n.lang) {
      $("langSelect").value = room.lang;
      loadLang(room.lang);
    }

    $("hostPill").textContent     = (i18n.lang==='de'?'Host':i18n.lang==='pl'?'Host':i18n.lang==='en'?'Host':'Хост') + ': ' + (room?.players?.[room.host]?.name ?? "—");
    $("roundPill").textContent    = (i18n.lang==='de'?'Runde':i18n.lang==='pl'?'Runda':i18n.lang==='en'?'Round':'Раунд') + ': ' + (room?.round ?? 1);
    $("categoryPill").textContent = (i18n.lang==='de'?'Kategorie':i18n.lang==='pl'?'Kategoria':i18n.lang==='en'?'Category':'Категория') + ': ' + (room?.category ?? "—");

    const cont = $("playersList"); cont.innerHTML = "";
    const players = room?.players ? Object.values(room.players) : [];
    players.sort((a,b)=>a.joinedAt-b.joinedAt);
    for (const p of players) {
      const d = document.createElement("div");
      d.className = "player";
      d.innerHTML = `
        <div>
          <div>${escapeHtml(p.name)}</div>
          ${p.uid===me.uid ? `<div class="me">${i18n.lang==='de'?'(du)':i18n.lang==='pl'?'(ty)':i18n.lang==='en'?'(you)':'(ты)'}</div>` : ""}
        </div>
        <div class="pill">${p.uid===room?.host ? 'HOST' : 'PLAYER'}</div>
      `;
      cont.appendChild(d);
    }

    const sb = $("scoreboard"); sb.innerHTML = "";
    const scores = room?.scores || {};
    for (const p of players) {
      const score = scores[p.uid] || 0;
      const d = document.createElement("div");
      d.className = "player";
      d.innerHTML = `<div>${escapeHtml(p.name)}</div><div class="pill">${i18n.lang==='de'?'Punkte':i18n.lang==='pl'?'Punkty':i18n.lang==='en'?'Points':'Очки'}: ${score}</div>`;
      sb.appendChild(d);
    }

    const amHost = !room.host || room.host === me.uid;
    $("startGameBtn").style.display = amHost ? "" : "none";
    $("rulesBtnRoundLobby").onclick = openRules;

    if (!pinnedView && room?.state === "round") showRound();
  });
}

async function startOrNextRound(room, players){
  const category = room.category || state.category;
  const word   = await randomWord(i18n.lang, category);
  const spyIdx = Math.floor(Math.random()*players.length);
  const spyUid = players[spyIdx].uid;
  const round  = (room.round || 0) + 1;
  const talkEnd= Date.now() + ROUND_SECONDS*1000;

  const updates = {
    [`rooms/${roomCode}/state`]: "round",
    [`rooms/${roomCode}/phase`]: "talk",
    [`rooms/${roomCode}/round`]: round,
    [`rooms/${roomCode}/spyUid`]: spyUid,
    [`rooms/${roomCode}/talkEndsAt`]: talkEnd,
    [`rooms/${roomCode}/votes`]: null,
    [`rooms/${roomCode}/result`]: null,
    [`rooms/${roomCode}/lang`]: safeLang()
  };

  for (const p of players) {
    const w = (p.uid === spyUid) ? "???" : word;
    updates[`playerPayloads/${roomCode}/${p.uid}`] = { word: w, round };
  }

  pruneUndefined(updates);
  await update(ref(db), updates);
  pinnedView = null;
}

function showRound(){
  showScreen("round");
  const room = roomSnap?.val();
  const isSpy = room?.spyUid === me.uid;

  $("myNamePill").textContent = me.name || "—";
  $("roleTag").textContent  = (i18n.lang==='de'?'Rolle':i18n.lang==='pl'?'Rola':i18n.lang==='en'?'Role':'Роль') + ': ' + (isSpy ? (i18n.lang==='de'?'Spion':i18n.lang==='pl'?'Szpieg':i18n.lang==='en'?'Spy':'Шпион') : (i18n.lang==='de'?'Bürger':i18n.lang==='pl'?'Obywatel':i18n.lang==='en'?'Citizen':'Гражданин'));
  $("phaseTag").textContent = (i18n.lang==='de'?'Phase':i18n.lang==='pl'?'Faza':i18n.lang==='en'?'Phase':'Фаза') + ': ' + (room?.phase==="talk" ? (i18n.lang==='de'?'Diskussion':i18n.lang==='pl'?'Dyskusja':i18n.lang==='en'?'Discussion':'Обсуждение') : room?.phase==="vote" ? (i18n.lang==='de'?'Abstimmung':i18n.lang==='pl'?'Głosowanie':i18n.lang==='en'?'Vote':'Голосование') : (i18n.lang==='de'?'Ergebnis':i18n.lang==='pl'?'Wynik':i18n.lang==='en'?'Result':'Результат'));

  (async ()=>{
    try{
      const s = await get(ref(db, `playerPayloads/${roomCode}/${me.uid}`));
      const payload = s.val();
      $("wordBox").textContent = payload?.word ?? (isSpy ? "???" : tt('word_appears_here','Слово появится здесь'));
    } catch {
      $("wordBox").textContent = isSpy ? "???" : tt('word_appears_here','Слово появится здесь');
    }
  })();

  $("hintBox").textContent = isSpy
    ? (i18n.lang==='de'?'Versuche anhand der Hinweise den Ort zu erraten.':i18n.lang==='pl'?'Na podstawie wskazówek spróbuj odgadnąć miejsce.':i18n.lang==='en'?'Use hints to guess the location.':'Пробуй по намёкам угадать место.')
    : tt('hint_citizen','Говорите намёками, не палите слово!');

  if (room?.phase === "talk" && room?.talkEndsAt) {
    startLocalTimer(room.talkEndsAt, async ()=>{
      const current = roomSnap?.val();
      if (current?.phase === "talk") {
        await update(ref(db, `rooms/${roomCode}`), { phase:"vote", votes:null, result:null });
      }
    });
  } else {
    stopLocalTimer();
  }

  const amHost = room?.host === me.uid;
  $("revealBtn").style.display     = room?.phase==="talk"   ? "" : "none";
  $("nextRoundBtn").style.display  = amHost && room?.phase==="result" ? "" : "none";
  $("voteSection").style.display   = room?.phase==="vote"   ? "" : "none";
  $("resultSection").style.display = room?.phase==="result" ? "" : "none";

  if (room?.phase==="vote")   renderVoteGrid();
  if (room?.phase==="result") renderResult();
}

async function renderVoteGrid(){
  let room = roomSnap?.val();
  let players = room?.players ? Object.values(room.players).filter(p=>!p.left) : [];

  if (!players.length) {
    const ps = (await get(ref(db, `rooms/${roomCode}/players`))).val() || {};
    players = Object.values(ps).filter(p=>!p.left);
  }

  const grid = $("voteGrid"); grid.innerHTML="";
  for (const p of players) {
    const card = document.createElement("div");
    card.className="player";
    card.innerHTML = `
      <div>${escapeHtml(p.name)} ${p.uid===me.uid?`<span class="tag">${i18n.lang==='de'?'(du)':i18n.lang==='pl'?'(ty)':i18n.lang==='en'?'(you)':'(ты)'}</span>`:''}</div>
      <button class="danger" ${p.uid===me.uid?'disabled':''}>${i18n.lang==='de'?'Abstimmen':i18n.lang==='pl'?'Głosuj':i18n.lang==='en'?'Vote':'Голосовать'}</button>
    `;
    const btn = card.querySelector("button");
    btn.onclick = async ()=>{
      await update(ref(db, `rooms/${roomCode}/votes/${me.uid}`), { target: p.uid, at: Date.now() });
      setStatus((i18n.lang==='de'?'Stimme gezählt: ':i18n.lang==='pl'?'Głos zapisany: ':i18n.lang==='en'?'Vote recorded: ':'Голос учтён: ')+p.name);
      await checkVotesAndFinish();
    };
    grid.appendChild(card);
  }
}

async function checkVotesAndFinish(){
  const snap = await get(ref(db, `rooms/${roomCode}`));
  const room = snap.val(); if (!room) return;
  const players = room.players ? Object.values(room.players).filter(p=>!p.left) : [];
  const votes = room.votes ? Object.values(room.votes) : [];
  if (votes.length < players.length) return;

  const tally = {};
  for (const v of votes) tally[v.target] = (tally[v.target]||0) + 1;
  let topTarget = null, topCount = -1;
  for (const [target,count] of Object.entries(tally)) {
    if (count > topCount) { topCount = count; topTarget = target; }
  }
  const citizensWin = topTarget === room.spyUid;

  const updates = {};
  const scores = room.scores || {};
  if (citizensWin) {
    for (const p of players) if (p.uid !== room.spyUid) updates[p.uid] = (scores[p.uid]||0) + 1;
  } else {
    updates[room.spyUid] = (scores[room.spyUid]||0) + 1;
  }

  await update(ref(db, `rooms/${roomCode}`), {
    phase:"result",
    result: { spyUid: room.spyUid, guessedUid: topTarget, citizensWin, tallies: tally, at: Date.now() },
    scores: { ...(scores||{}), ...updates }
  });
}

function renderResult(){
  const room = roomSnap?.val(); if (!room) return;
  const r = room.result; if (!r) return;
  const spyName = room.players?.[r.spyUid]?.name ?? "—";
  const guessName = room.players?.[r.guessedUid]?.name ?? "—";
  $("resultText").innerHTML = `
    <div style="font-size:18px;margin-bottom:8px;">${i18n.lang==='de'?'Ergebnis':i18n.lang==='pl'?'Wynik':i18n.lang==='en'?'Result':'Итоги'}</div>
    <div>${i18n.lang==='de'?'Spion war':i18n.lang==='pl'?'Szpiegiem był':i18n.lang==='en'?'Spy was':'Шпионом был'}: <b>${escapeHtml(spyName)}</b></div>
    <div>${i18n.lang==='de'?'Vermutet wurde':i18n.lang==='pl'?'Wskazano':i18n.lang==='en'?'Voted as spy':'Предположили'}: <b>${escapeHtml(guessName)}</b></div>
    <div>${i18n.lang==='de'?'Kategorie':i18n.lang==='pl'?'Kategoria':i18n.lang==='en'?'Category':'Категория'}: <b>${escapeHtml(room.category ?? "—")}</b></div>
    <div style="margin-top:8px;">${r.citizensWin ? (i18n.lang==='de'?'✅ Bürger gewinnen!':i18n.lang==='pl'?'✅ Obywatele wygrywają!':i18n.lang==='en'?'✅ Citizens win!':'✅ Граждане победили!') : (i18n.lang==='de'?'❌ Spion entkommt!':i18n.lang==='pl'?'❌ Szpieg ucieka!':i18n.lang==='en'?'❌ Spy escapes!':'❌ Шпион ускользнул!')}</div>
  `;
}

// --- Firebase: rooms / players ---
async function joinAsPlayer(code, {uid,name}){
  const now = Date.now();
  const roomRef = ref(db, `rooms/${code}`);
  const snap = await get(roomRef);
  let room = snap.val();

  if (!room) {
    room = {
      createdAt: now, state: "lobby", phase: "talk",
      host: uid, round: 1, category: state.category, players: {}, scores: {}, lang: safeLang()
    };
    pruneUndefined(room);
    await set(roomRef, room);
  }

  await update(ref(db, `rooms/${code}/players/${uid}`), { uid, name, joinedAt: now, left: false });

  const latest = (await get(roomRef)).val() || {};
  if (!latest.host) { await update(roomRef, { host: uid }); }

  if (unsubRoom) unsubRoom();
  unsubRoom = onValue(roomRef, (s)=>{
    roomSnap = s;
    const r = s.val();
    if (!roomCode) roomCode = code;
    setRoomHeader();

    if (r?.lang && r.lang !== i18n.lang) {
      $("langSelect").value = r.lang;
      loadLang(r.lang);
    }

    if (!pinnedView && r?.state==="lobby") showLobby();
    if (!pinnedView && r?.state==="round") showRound();
  });

  window.addEventListener("beforeunload", async ()=>{
    try { await update(ref(db, `rooms/${code}/players/${uid}`), { left:true }); } catch {}
  });
}

async function leaveRoom(){
  if (!roomCode || !me.uid) { showScreen("auth"); return; }
  await update(ref(db, `rooms/${roomCode}/players/${me.uid}`), { left:true });
  showScreen("auth");
  setStatus(i18n.lang==='de'?'Du hast den Raum verlassen.':i18n.lang==='pl'?'Opuściłeś pokój.':i18n.lang==='en'?'You left the room.':'Вы вышли из комнаты.');
  if (unsubRoom) unsubRoom();
  roomCode = null; setRoomHeader();
  pinnedView = null;
}

async function roomExists(code){
  const s = await get(ref(db, `rooms/${code}`));
  return s.exists();
}

async function createRoom(hostUid, category){
  const code = genRoomCode();
  const now = Date.now();
  const cats = await getCategories(i18n.lang);
  const categoryFinal = category || state.category || (cats[0] || '');
  const payload = {
    createdAt: now, state:"lobby", phase:"talk", host: hostUid,
    round: 1, category: categoryFinal, players: {}, scores: {}, lang: safeLang()
  };
  pruneUndefined(payload);
  await set(ref(db, `rooms/${code}`), payload);
  return code;
}

function genRoomCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c=""; for (let i=0;i<4;i++) c+=chars[Math.floor(Math.random()*chars.length)];
  return c;
}

// --- Rules modal (per-lang files) ---
async function openRules(){
  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop){
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rulesTitle">
        <header>
          <h3 id="rulesTitle"></h3>
          <button class="close" id="closeRulesBtn"></button>
        </header>
        <div class="rules-content" id="rulesContent"></div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeRules(); });
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeRules(); });
  }

  const title = tt('rules_title','Правила');
  const close = tt('rules_close','Закрыть');

  let html = tt('rules_html','<p>Правила скоро будут…</p>');
  try {
    const r = await import(`./rules/${safeLang()}.js`);
    if (r?.default) html = r.default;
  } catch (_) {}

  const titleEl = document.getElementById('rulesTitle');
  const closeEl = document.getElementById('closeRulesBtn');
  const contEl  = document.getElementById('rulesContent');
  if (titleEl) titleEl.textContent = title;
  if (closeEl) closeEl.textContent = close;
  if (contEl)  contEl.innerHTML = html;

  backdrop.style.display = 'flex';
  if (closeEl) closeEl.onclick = closeRules;
}
function closeRules(){ const bd=document.querySelector('.modal-backdrop'); if (bd) bd.style.display='none'; }

init().catch(err => { console.error('Init failed', err); setStatus('Init error. See console.'); });