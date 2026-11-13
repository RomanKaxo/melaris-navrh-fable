/* Melaris · návrh webu. Bez sestavování: GSAP + ScrollTrigger + Lenis z assets/vendor, 3D Mel v mel3d.js. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DESK = matchMedia('(min-width: 900px)');
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- jazyk ---------- */
  let lang = 'cs';
  const T = (cs, en) => (lang === 'en' ? en : cs);
  const langHooks = [];
  function setLang(l) {
    lang = l; root.lang = l;
    $$('[data-en]').forEach(el => {
      if (el.dataset.cs === undefined) el.dataset.cs = el.innerHTML;
      el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.cs;
    });
    $$('#lang span').forEach((s, i) => s.classList.toggle('on', (i === 1) === (l === 'en')));
    $('#lang').setAttribute('aria-label', l === 'en' ? 'Přepnout do češtiny' : 'Switch to English');
    langHooks.forEach(f => f());
    try { localStorage.setItem('melaris-navrh-lang', l); } catch (e) {}
    if (ScrollTrigger) ScrollTrigger.refresh();
  }
  $('#lang').addEventListener('click', () => setLang(lang === 'cs' ? 'en' : 'cs'));

  /* ---------- Mel: kotvy a stavy ---------- */
  const STATES = ['idle', 'thinking', 'working', 'waiting', 'error', 'done'];
  const Mel = window.MelStage = {
    anchors: $$('[data-mel-anchor]'),
    set(el, s) {
      if (!el || el.dataset.mel === s) return;
      el.dataset.mel = s;
      const img = $('.mel-still', el); if (img) img.src = `assets/mel/mel-32-${s}.svg`;
    },
  };

  const heroAnchor = $('#hero-anchor'), chips = $$('.states button');
  let autoCycle = null;
  function heroState(s) {
    Mel.set(heroAnchor, s);
    chips.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.state === s)));
  }
  chips.forEach(b => b.addEventListener('click', () => { clearInterval(autoCycle); autoCycle = null; heroState(b.dataset.state); }));
  if (!RM) {
    const order = ['thinking', 'working', 'waiting', 'done', 'idle']; let i = 0;
    setTimeout(() => { if (autoCycle === null) autoCycle = setInterval(() => { if (scrollY < innerHeight * 0.6 && !document.hidden) heroState(order[i++ % order.length]); }, 2600); }, 2200);
  }

  /* ---------- plynulé posouvání ---------- */
  let lenis = null;
  if (!RM && window.Lenis && gsap) {
    lenis = new window.Lenis({autoRaf: false, anchors: {offset: 0}, lerp: 0.11});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- nástup ---------- */
  requestAnimationFrame(() => $$('.hero .kin, .hero-lines').forEach(k => k.classList.add('in')));
  $$('.sec-head, .story-head, .mlist li, .st-col, .faq, .term-copy, .tty, .models-foot, .cta-copy, .map-wrap, .mline, .mhub').forEach(el => {
    el.classList.add('rv');
    if (el.matches('.mlist li')) el.style.setProperty('--i', [...el.parentNode.children].indexOf(el));
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin: '0px 0px -12% 0px'});
  $$('.rv, .cta .kin').forEach(el => io.observe(el));

  /* ---------- lišta a boční linka ---------- */
  const bar = $('.bar'), railFill = $('#rail-fill'), railLinks = $$('.rail a');
  const secs = railLinks.map(a => document.getElementById(a.dataset.st));
  function onScroll() {
    const y = scrollY, vh = innerHeight;
    bar.classList.toggle('is-solid', y > 24);
    const max = document.documentElement.scrollHeight - vh;
    if (railFill) railFill.style.transform = `scaleY(${max > 0 ? Math.min(1, y / max) : 0})`;
    let on = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.5) on = i; });
    railLinks.forEach((a, i) => { a.classList.toggle('is-on', i === on); a.classList.toggle('is-past', i < on); });
  }
  addEventListener('scroll', onScroll, {passive: true}); onScroll();

  /* ---------- pás se zastávkami ---------- */
  const band = $('#band-row');
  if (band && gsap && !RM) {
    let x = 0, vel = 0, lastY = scrollY, half = 0;
    const measure = () => { half = band.scrollWidth / 2; };
    measure(); addEventListener('resize', measure); if (document.fonts) document.fonts.ready.then(measure);
    gsap.ticker.add(() => {
      const d = scrollY - lastY; lastY = scrollY; vel += (d - vel) * 0.2;
      x -= 0.6 + Math.abs(vel) * 0.9; if (half && -x > half) x += half;
      band.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-10, Math.min(10, -vel * 0.35))}deg)`;
    });
  }

  /* ---------- příběh ---------- */
  const story = $('.story'), chs = $$('.ch'), stops = $$('.stop'), stopsFill = $('#stops-fill'), stageAnchor = $('#stage-anchor');
  let chIndex = -1;
  const typeEl = $('.type');
  let typeTimer = null;
  function typeBrief() {
    if (!typeEl) return;
    const text = T(typeEl.dataset.type, typeEl.dataset.typeEn);
    clearInterval(typeTimer);
    if (RM) { typeEl.textContent = text; return; }
    let n = 0; typeEl.textContent = '';
    typeTimer = setInterval(() => { typeEl.textContent = text.slice(0, ++n); if (n >= text.length) clearInterval(typeTimer); }, 34);
  }
  langHooks.push(typeBrief);
  function setChapter(i) {
    if (i === chIndex) return; chIndex = i;
    chs.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.classList.toggle('is-past', k < i); });
    stops.forEach((s, k) => s.classList.toggle('is-on', k <= i));
    Mel.set(stageAnchor, chs[i].dataset.mel);
    if (i === 0) typeBrief();
  }
  if (gsap && ScrollTrigger && !RM) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 560px)', () => {
      story.classList.add('is-pinned');
      setChapter(0);
      const st = ScrollTrigger.create({
        trigger: story, start: 'top top', end: '+=420%', pin: '.story-pin', scrub: true, anticipatePin: 1,
        onUpdate(self) {
          setChapter(Math.min(4, Math.floor(self.progress * 5)));
          stopsFill.style.transform = `scaleX(${Math.min(1, 0.02 + self.progress)})`;
        },
      });
      return () => { st.kill(); story.classList.remove('is-pinned'); chs.forEach(c => c.classList.remove('is-on', 'is-past')); chIndex = -1; };
    });
  }
  // bez připnutí (telefon, klidný režim): zadání se napíše, až je vidět
  if (typeEl) { const tio = new IntersectionObserver(es => { if (es[0].isIntersecting) { if (!story.classList.contains('is-pinned')) typeBrief(); tio.disconnect(); } }, {threshold: 0.6}); tio.observe(typeEl.closest('.ui')); if (RM) typeBrief(); }

  /* schválení: jediná věc, kterou si návštěvník zkusí */
  const ap = $('#approve'), apOut = $('.ap-out', ap), waitCh = ap.closest('.ch'), waitAnchor = $('.ch-mel', waitCh);
  let apState = '';
  function apRender() {
    ap.classList.toggle('is-yes', apState === 'yes' || apState === 'sent'); ap.classList.toggle('is-no', apState === 'no');
    if (apState === 'yes') {
      apOut.innerHTML = `${T('Schváleno. Zpráva je ve frontě k odeslání.', 'Approved. The message is queued for sending.')} <button type="button">${T('Zrušit odeslání', 'Cancel send')}</button>`;
      $('button', apOut).addEventListener('click', () => apSet(''));
    } else if (apState === 'no') {
      apOut.innerHTML = `${T('Odmítnuto. Nic neodešlo.', 'Rejected. Nothing was sent.')} <button type="button">${T('Zkusit znovu', 'Try again')}</button>`;
      $('button', apOut).addEventListener('click', () => apSet(''));
    } else apOut.textContent = '';
  }
  function apSet(s) {
    apState = s; apRender();
    const m = s === 'yes' ? 'done' : s === 'no' ? 'idle' : 'waiting';
    waitCh.dataset.mel = m; Mel.set(waitAnchor, m);
    if (story.classList.contains('is-pinned') && chIndex === 3) Mel.set(stageAnchor, m);
  }
  $$('[data-ap]', ap).forEach(b => b.addEventListener('click', () => apSet(b.dataset.ap)));
  langHooks.push(apRender);

  /* ---------- mapa ---------- */
  const LINES = {
    a: {c: '#F21B68', cs: 'Linka A · práce', en: 'Line A · work'},
    b: {c: '#FF92BA', cs: 'Linka B · komunikace', en: 'Line B · communication'},
    c: {c: '#FAF6FF', cs: 'Linka C · automatizace', en: 'Line C · automation'},
    d: {c: '#8E87A8', cs: 'Linka D · stroj', en: 'Line D · machine'},
  };
  const ST = {
    db: {l: 'a', p: [60, 190], side: 't', cs: 'DB editor', en: 'DB editor', b: 'ok',
      tcs: 'SQLite soubor v projektu: tabulky, SQL konzole a historie změn. Nové připojení je vždy jen pro čtení a každý zápis potvrzuješ. PostgreSQL a MySQL zatím nemají ovladače.',
      ten: 'A SQLite file inside the project: tables, an SQL console and edit history. A new connection is always read-only and you confirm every write. PostgreSQL and MySQL have no drivers yet.'},
    projekty: {l: 'a', p: [190, 190], side: 't', cs: 'Projekty', en: 'Projects', b: 'ok',
      tcs: 'Konverzace, soubory, karty a pokyny pohromadě. Mozek projektu drží paměť a rozhodnutí. Pokyny jdou do promptu jako data, podezřelé se označí varováním.',
      ten: 'Conversations, files, cards and instructions together. The project brain keeps memory and decisions. Instructions enter the prompt as data; suspicious ones get a warning.'},
    ulohy: {l: 'a', p: [345, 300], side: 'b', cs: 'Úlohy a tým', en: 'Tasks and team', b: 'ok',
      tcs: 'Mel přidělí nezávislé úkoly specialistům z katalogu 23 profilů, nejvýš třem najednou. Každý běh najdeš na nástěnce: co běží, co čeká na tebe a co je hotové.',
      ten: 'Mel hands independent tasks to specialists from a catalogue of 23 profiles, three at a time at most. Every run is on the board: what runs, what waits for you, what is done.'},
    ceka: {l: 'a', p: [665, 300], side: 't', cs: 'Čeká na tebe', en: 'Waiting for you', b: 'ok',
      tcs: 'Schválení, otázky a chyby na jednom místě, s počtem v navigaci. Když úloha čeká na tvoje rozhodnutí déle než 10 minut, přijde upozornění.',
      ten: 'Approvals, questions and errors in one place, with a count in the navigation. When a task waits for your decision for more than 10 minutes, you get a notification.'},
    souhrny: {l: 'a', p: [880, 390], side: 'b', cs: 'Souhrny', en: 'Summaries', b: 'ok',
      tcs: 'Řešení, ke kterým se můžeš vrátit: co se udělalo a kdo na tom pracoval, se štítky, stavem a odkazem na konverzaci. Každý souhrn vyexportuješ do Markdownu.',
      ten: 'Solutions you can come back to: what was done and who worked on it, with tags, a status and a link to the conversation. Each summary exports to Markdown.'},
    posta: {l: 'b', p: [120, 500], side: 't', cs: 'Pošta', en: 'Mail', b: 'test',
      tcs: 'IMAP a SMTP, víc účtů, vlákna, složky a štítky. Mel třídí nové zprávy a píše koncepty, odesíláš ty. Zprávu ve frontě ještě stihneš zrušit. Skutečné účty čekají na ověření.',
      ten: 'IMAP and SMTP, several accounts, threads, folders and labels. Mel sorts new messages and writes drafts; you send. A queued message can still be cancelled. Real accounts await verification.'},
    telegram: {l: 'b', p: [830, 160], side: 't', cs: 'Telegram', en: 'Telegram', b: 'test',
      tcs: 'Spárovaný telefon spouští úlohy jen pro čtení, i hlasovkou. Cizí účty se ignorují. Schvalovat z Telegramu zatím nejde.',
      ten: 'A paired phone starts read-only tasks, by voice message too. Other accounts are ignored. Approving from Telegram is not possible yet.'},
    plany: {l: 'c', p: [500, 30], side: 'r', cs: 'Plány', en: 'Schedules', b: 'ok',
      tcs: 'Úlohy v čase nebo při události přes webhook. Plánované úlohy smí jen číst a odpovídat. Plán běží, jen když běží Melaris.',
      ten: 'Tasks on a schedule or on a webhook event. Scheduled tasks may only read and reply. A schedule runs only while Melaris is running.'},
    playbooky: {l: 'c', p: [500, 140], side: 'r', cs: 'Playbooky', en: 'Playbooks', b: 'ok',
      tcs: 'Markdown se zaškrtávacími úlohami. Pro každou úlohu nastoupí čerstvý agent a na branách rozhoduje člověk.',
      ten: 'Markdown with checkbox tasks. A fresh agent takes each task, and a person decides at the gates.'},
    oddeleni: {l: 'c', p: [500, 500], side: 'b', cs: 'Oddělení', en: 'Departments', b: 'test',
      tcs: 'Marketing je první balík: 7 modulů, 35 agentů, ranní stránka a živá mapa agentů a konektorů. Každé zveřejnění je položka fronty vázaná na přesný obsah. Žádný konektor zatím nebyl vyzkoušen proti skutečné službě.',
      ten: 'Marketing is the first pack: 7 modules, 35 agents, a morning page and a live map of agents and connectors. Every publication is a queue item bound to the exact content. No connector has been tried against a real service yet.'},
    cli: {l: 'd', p: [240, 40], side: 'r', cs: 'CLI', en: 'CLI', b: 'ok',
      tcs: 'Příkaz melaris ve složce projektu: chat v terminálu s ASCII Mel, /model a /mode, /plan bez zápisu, /diff a /resume. Správa nástěnky, plánů, záloh a auditu.',
      ten: 'The melaris command inside a project folder: terminal chat with ASCII Mel, /model and /mode, /plan without writing, /diff and /resume. Manage the board, schedules, backups and audit.'},
    sandbox: {l: 'd', p: [360, 160], side: 'l', cs: 'Sandbox', en: 'Sandbox', b: 'beta',
      tcs: 'Příkazy, které Mel spouští místně, můžou na Linuxu běžet v bubblewrapu: zápis jen do složky projektu, síť vypnutá nebo jen na povolené hostitele. Zapínáš ho výslovně.',
      ten: 'Commands Mel runs locally can run inside bubblewrap on Linux: writes only to the project folder, network off or limited to allowed hosts. You switch it on explicitly.'},
    modely: {l: 'd', p: [660, 460], side: 'r', cs: 'Modely', en: 'Models', b: 'ok',
      tcs: 'Předplatná Claude Code, Codex a Grok Build běží v originálním programu poskytovatele. Další služby připojíš přes OmniRoute, Ollamu nebo API klíč.',
      ten: 'Claude Code, Codex and Grok Build subscriptions run in the provider’s original program. Other services connect through OmniRoute, Ollama or an API key.'},
  };
  const HUB = [500, 300];
  const ROUTES = {
    a: ['db', 'projekty', [300, 300], 'ulohy', HUB, 'ceka', [790, 300], 'souhrny'],
    b: ['posta', [300, 500], HUB, [640, 160], 'telegram'],
    c: ['plany', 'playbooky', HUB, 'oddeleni'],
    d: ['cli', 'sandbox', HUB, 'modely'],
  };
  const BADGE = {ok: ['', 'Hotové', 'Done'], test: ['b-test', 'V testu', 'In testing'], beta: ['b-beta', 'Beta', 'Beta']};
  const HUBINFO = {cs: 'Mel', en: 'Mel',
    tcs: 'Mel stojí uprostřed a rozděluje práci. Běžné otázky na ovládání pozná česky i anglicky bez volání AI a 15 průvodců ti ukáže správné místo na obrazovce.',
    ten: 'Mel stands in the middle and hands out the work. Common how-to questions are recognised in Czech and English without calling an AI, and 15 guides point you to the right spot on screen.'};
  const pts = r => r.map(k => (typeof k === 'string' ? ST[k].p : k));
  function roundPath(p, r = 30) {
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length - 1; i++) {
      const [ax, ay] = p[i - 1], [bx, by] = p[i], [cx, cy] = p[i + 1];
      const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
      const cross = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
      if (Math.abs(cross) < 1) { d += `L${bx} ${by}`; continue; }
      const k1 = Math.min(r, l1 / 2) / l1, k2 = Math.min(r, l2 / 2) / l2;
      d += `L${bx - (bx - ax) * k1} ${by - (by - ay) * k1}Q${bx} ${by} ${bx + (cx - bx) * k2} ${by + (cy - by) * k2}`;
    }
    const e = p[p.length - 1]; return d + `L${e[0]} ${e[1]}`;
  }
  const mapCanvas = $('#map-canvas'), mapInfo = $('#map-info'), mapLines = $('#map-lines');
  let sel = 'hub';
  function buildMap() {
    let svg = '<svg viewBox="0 0 1000 600" aria-hidden="true" focusable="false">';
    for (const k in ROUTES) {
      const d = roundPath(pts(ROUTES[k]));
      svg += `<path class="mp" data-line="${k}" id="mp-${k}" d="${d}" stroke="${LINES[k].c}"/>`;
    }
    if (!RM) for (const k in ROUTES) {
      const dur = {a: 13, b: 11, c: 9, d: 10}[k];
      svg += `<circle class="train" data-line="${k}" r="7" fill="${k === 'c' ? '#171522' : '#FAF6FF'}"><animateMotion dur="${dur}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"><mpath href="#mp-${k}"/></animateMotion></circle>`;
    }
    svg += '</svg>';
    let html = svg;
    for (const id in ST) {
      const s = ST[id];
      html += `<button type="button" class="stn" data-id="${id}" data-line="${s.l}" data-l="${s.side}" style="left:${s.p[0] / 10}%;top:${s.p[1] / 6}%;--c:${LINES[s.l].c}" aria-pressed="false"><span>${T(s.cs, s.en)}</span></button>`;
    }
    html += `<button type="button" class="hub" data-id="hub" aria-label="Mel"><div class="mel-anchor" data-mel-anchor data-mel="idle"><img class="mel-still" loading="lazy" src="assets/mel/mel-32-idle.svg" alt="" width="120" height="120"></div></button>`;
    mapCanvas.innerHTML = html;

    let m = `<div class="mhub"><div class="mel-anchor" data-mel-anchor data-mel="idle"><img class="mel-still" loading="lazy" src="assets/mel/mel-32-idle.svg" alt="" width="96" height="96"></div><div>Mel<small>${T('přestupní stanice všech linek', 'the interchange of all lines')}</small></div></div>`;
    const plus = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    for (const k in LINES) {
      m += `<section class="mline" style="--c:${LINES[k].c}"><h3><i></i>${T(LINES[k].cs, LINES[k].en)}</h3><ol>`;
      for (const id of ROUTES[k]) if (typeof id === 'string') {
        const s = ST[id], b = BADGE[s.b];
        m += `<li class="mst"><button type="button" aria-expanded="false" aria-controls="ms-${id}">${T(s.cs, s.en)}${plus}</button><div class="mst-body" id="ms-${id}"><div><p>${T(s.tcs, s.ten)}</p><span class="badge ${b[0]}">${T(b[1], b[2])}</span></div></div></li>`;
      }
      m += '</ol></section>';
    }
    mapLines.innerHTML = m;
    $$('.mst > button', mapLines).forEach(b => b.addEventListener('click', () => b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true'))));
    $$('.stn, .hub', mapCanvas).forEach(b => {
      b.addEventListener('click', () => select(b.dataset.id, true));
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') select(b.dataset.id, false); });
    });
    Mel.anchors = $$('[data-mel-anchor]');
    select(sel, false, true);
  }
  function select(id, byClick, quiet) {
    if (id === sel && !quiet && !byClick) return;
    sel = id;
    const hub = id === 'hub', s = hub ? HUBINFO : ST[id];
    mapCanvas.classList.toggle('has-sel', !hub);
    $$('.stn', mapCanvas).forEach(b => { const on = b.dataset.id === id; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-hot', !hub && b.dataset.line === s.l); });
    $$('.mp, .train', mapCanvas).forEach(p => p.classList.toggle('is-hot', !hub && p.dataset.line === s.l));
    const b = hub ? null : BADGE[s.b];
    mapInfo.innerHTML = (hub ? `<div class="li" style="--c:#F21B68"><i></i>${T('Přestup na všechny linky', 'Change for all lines')}</div>` : `<div class="li" style="--c:${LINES[s.l].c}"><i></i>${T(LINES[s.l].cs, LINES[s.l].en)}</div>`) +
      `<h3>${T(s.cs, s.en)}</h3><p>${T(s.tcs, s.ten)}</p>` + (b ? `<span class="badge ${b[0]}">${T(b[1], b[2])}</span>` : '');
    if (!quiet) { mapInfo.classList.remove('swap'); void mapInfo.offsetWidth; mapInfo.classList.add('swap'); }
    const hubAnchor = $('.hub .mel-anchor', mapCanvas);
    Mel.set(hubAnchor, hub ? 'done' : s.b === 'ok' ? 'working' : 'thinking');
    clearTimeout(select.t); select.t = setTimeout(() => Mel.set(hubAnchor, 'idle'), 1600);
  }
  buildMap();
  langHooks.push(buildMap);

  /* ---------- obrazovky: hloubka podle polohy ---------- */
  const reel = $('#reel'), shots = $$('.shot', reel), count = $('#reel-count'), prevB = $('#reel-prev'), nextB = $('#reel-next');
  let reelIdx = 0, reelTick = false;
  function reelDepth() {
    reelTick = false;
    const r = reel.getBoundingClientRect(), mid = r.left + r.width / 2, desk = DESK.matches;
    let best = 0, bd = Infinity;
    shots.forEach((s, i) => {
      const b = s.getBoundingClientRect(), d = (b.left + b.width / 2 - mid) / b.width;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      if (RM) return;
      const c = Math.max(-1.4, Math.min(1.4, d));
      s.firstElementChild.style.transform = `translateZ(${-Math.abs(c) * (desk ? 220 : 90)}px) rotateY(${-c * (desk ? 32 : 18)}deg) rotateX(${desk ? 2 : 0}deg)`;
      s.lastElementChild.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.6));
    });
    reelIdx = best; count.textContent = `${best + 1} / ${shots.length}`;
    prevB.disabled = best === 0; nextB.disabled = best === shots.length - 1;
  }
  const reelReq = () => { if (!reelTick) { reelTick = true; requestAnimationFrame(reelDepth); } };
  reel.addEventListener('scroll', reelReq, {passive: true}); addEventListener('resize', reelReq); reelDepth();
  const reelGo = i => { const s = shots[Math.max(0, Math.min(shots.length - 1, i))]; reel.scrollTo({left: s.offsetLeft - (reel.clientWidth - s.clientWidth) / 2, behavior: RM ? 'auto' : 'smooth'}); };
  prevB.addEventListener('click', () => reelGo(reelIdx - 1)); nextB.addEventListener('click', () => reelGo(reelIdx + 1));
  reel.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); reelGo(reelIdx + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); reelGo(reelIdx - 1); } });
  langHooks.push(() => { reel.setAttribute('aria-label', T('Obrazovky aplikace, posouvej do stran', 'App screens, scroll sideways')); prevB.setAttribute('aria-label', T('Předchozí obrazovka', 'Previous screen')); nextB.setAttribute('aria-label', T('Další obrazovka', 'Next screen')); });
  if (gsap && ScrollTrigger && !RM) {
    gsap.fromTo(reel, {x: () => innerWidth * 0.22}, {x: 0, ease: 'none', scrollTrigger: {trigger: reel, start: 'top bottom', end: 'top 30%', scrub: true, onUpdate: reelReq}});
  }

  /* ---------- terminál ---------- */
  const ASCII = {
    idle: '\n .######..######.\n #"  ..    ..  "#\n #  #  #  #  #  #\n #   ""    ""   #\n #.    ".."    .#\n #######""#######\n "####"    "####"',
    thinking: '            . o O\n .######..######.\n #"  ..    ..  "#\n #  ##..  ##..  #\n #   ""    ""   #\n #.      ..    .#\n #######""#######\n "####"    "####"',
    working: '        <>\n .######..######.\n #"            "#\n #  #""#  #""#  #\n #   ""    ""   #\n #.    ....    .#\n #######""#######\n "####"    "####"',
    waiting: '\n .######..######.\n #"  ..    ..  "#\n #  #""#  #""#  #\n #   ""    ""   #\n #.     ..     .#\n #######""#######\n "####"    "####"/',
    done: ' *              *\n .######..######.\n #"            "#\n #  ."".  ."".  #\n #              #\n #.   "...."   .#\n #######""#######\n "####"    "####"',
  };
  const TTY = [
    ['idle', 'Připraveno', 'Ready', ''],
    ['thinking', 'Přemýšlí', 'Thinking', '/plan přidej otevírací dobu'],
    ['working', 'Pracuje', 'Working', '/plan přidej otevírací dobu'],
    ['waiting', 'Čeká na tebe', 'Waiting for you', '/diff'],
    ['done', 'Hotovo', 'Done', '/diff'],
  ];
  const TTY_EN = {'/plan přidej otevírací dobu': '/plan add opening hours'};
  const ascii = $('#ascii'), ttyState = $('#tty-state'), ttyType = $('#tty-type');
  let ttyI = 0, ttyTimer = null;
  function ttyShow() {
    const [s, cs, en, cmd] = TTY[ttyI % TTY.length];
    ascii.textContent = ASCII[s]; ttyState.textContent = T(cs, en); ttyType.textContent = lang === 'en' ? (TTY_EN[cmd] || cmd) : cmd;
  }
  ttyShow(); langHooks.push(ttyShow);
  if (!RM) new IntersectionObserver(es => {
    clearInterval(ttyTimer);
    if (es[0].isIntersecting) ttyTimer = setInterval(() => { ttyI++; ttyShow(); }, 1900);
  }, {threshold: 0.3}).observe($('.tty'));

  /* ---------- drobný paralax velkých prvků ---------- */
  if (gsap && ScrollTrigger && !RM) {
    gsap.to('.foot-word', {yPercent: -18, ease: 'none', scrollTrigger: {trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true}});
    const hs = {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true};
    gsap.to('#h1 .ln:nth-child(1)', {xPercent: -6, ease: 'none', scrollTrigger: hs});
    gsap.to('#h1 .ln:nth-child(2)', {xPercent: 7, ease: 'none', scrollTrigger: hs});
    gsap.to('.hero-lines', {yPercent: 12, ease: 'none', scrollTrigger: hs});
  }

  /* ---------- uložený jazyk ---------- */
  try { if (localStorage.getItem('melaris-navrh-lang') === 'en') setLang('en'); } catch (e) {}

  /* ---------- 3D Mel až po prvním vykreslení ---------- */
  function webglOK() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  if (!RM && gsap && webglOK()) {
    const boot = () => import('./mel3d.js').catch(err => console.warn('Mel 3D se nenačetl, zůstává kresba.', err));
    if (document.readyState === 'complete') setTimeout(boot, 60); else addEventListener('load', () => setTimeout(boot, 60));
  }
})();
