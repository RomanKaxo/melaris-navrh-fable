/* Melaris · návrh chatu. Statická ukázka: nic se nikam neodesílá, stavy se mění jen v tomto okně. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const VIEWS = ['nove', 'beh', 'schvaleni', 'preruseno', 'hotovo'];
  const wide = () => matchMedia('(min-width: 1181px)').matches;
  const phone = () => matchMedia('(max-width: 860px)').matches;
  const now = () => new Date().toLocaleTimeString('cs-CZ', {hour: 'numeric', minute: '2-digit'});
  const icon = (name, cls = 'i s') => `<svg class="${cls}"><use href="#i-${name}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  let current = 'beh';
  let panelTouched = false;
  let running = true; // stav běhu v konverzaci „Ceník na web“

  /* ---------- Hlášky ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = text => {
    toastEl.textContent = text;
    toastEl.dataset.show = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.dataset.show = 'false'; }, 3200);
  };

  /* ---------- Motiv ---------- */
  const themeBtn = $('#theme');
  const paintTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('#themeIcon').setAttribute('href', dark ? '#i-sun' : '#i-moon');
    themeBtn.setAttribute('aria-label', dark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv');
  };
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('melaris-navrh-theme', next); } catch {}
    paintTheme();
  });
  paintTheme();

  /* ---------- Konverzace ---------- */
  const view = id => $('#v-' + id);
  const setSidebar = (id, mark, sub) => {
    const link = $(`.conv[data-nav="${id}"]`);
    if (!link) return;
    const m = $('[data-mark]', link), s = $('[data-sub]', link);
    if (m) m.className = 'mark ' + mark;
    if (s) s.textContent = sub;
  };
  const paintSend = () => {
    const queueing = (current === 'beh' && running) || (current === 'schvaleni' && view('schvaleni').dataset.send === 'Zařadit');
    const label = $('#sendLabel'), send = $('#send');
    label.hidden = !queueing;
    label.textContent = queueing ? 'Zařadit' : '';
    send.classList.toggle('labelled', queueing);
    send.setAttribute('aria-label', queueing ? 'Zařadit zprávu do fronty' : 'Odeslat');
    $('#prompt').placeholder = current === 'nove' ? 'Napiš zadání' : queueing ? (phone() ? 'Zpráva do fronty' : 'Napiš další zprávu, počká ve frontě') : 'Napiš zprávu';
  };
  const route = () => {
    const id = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'beh';
    current = id;
    VIEWS.forEach(v => { view(v).hidden = v !== id; });
    $('#title').textContent = view(id).dataset.title;
    document.title = view(id).dataset.title + ' · Melaris, návrh chatu';
    $$('[data-nav]').forEach(a => a.dataset.nav === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    closeDrawer(false);
    closePop(false);
    if (!panelTouched) setPanel(id === 'hotovo' && wide(), false);
    paintSend();
    buildFiles();
    const thread = $('.thread', view(id));
    thread.scrollTop = id === 'nove' ? 0 : thread.scrollHeight;
  };

  /* ---------- Seznam: sloupec na počítači, šuplík na telefonu ---------- */
  const listToggle = $('#listToggle'), drawerOpen = $('#drawerOpen');
  listToggle.addEventListener('click', () => {
    const open = app.dataset.list !== 'open';
    app.dataset.list = open ? 'open' : 'closed';
    listToggle.setAttribute('aria-pressed', String(open));
  });
  const openDrawer = () => {
    app.dataset.drawer = 'open';
    drawerOpen.setAttribute('aria-expanded', 'true');
    ($('.list [aria-current="page"]') || $('.list a')).focus();
  };
  function closeDrawer(refocus = true) {
    if (app.dataset.drawer !== 'open') return;
    app.dataset.drawer = 'closed';
    drawerOpen.setAttribute('aria-expanded', 'false');
    if (refocus) drawerOpen.focus();
  }
  drawerOpen.addEventListener('click', openDrawer);
  $('#scrim').addEventListener('click', () => closeDrawer());
  $('[data-drawer-close]').addEventListener('click', () => closeDrawer());

  /* ---------- Panel náhledu ---------- */
  const panelBtn = $('#panelToggle'), panelBtnM = $('#panelToggleM');
  function setPanel(open, focus = true) {
    app.dataset.panel = open ? 'open' : 'closed';
    panelBtn.setAttribute('aria-pressed', String(open));
    if (open && !wide() && focus) $('#panelClose').focus();
  }
  const togglePanel = () => { panelTouched = true; setPanel(app.dataset.panel !== 'open'); };
  panelBtn.addEventListener('click', togglePanel);
  panelBtnM.addEventListener('click', togglePanel);
  $('#panelClose').addEventListener('click', () => {
    panelTouched = true; setPanel(false);
    (phone() ? panelBtnM : panelBtn).focus();
  });
  const tabs = $$('.tab');
  const showTab = id => {
    tabs.forEach(t => {
      const on = t.id === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const pane = document.getElementById(t.getAttribute('aria-controls'));
      if (pane.id === 'pane-web') pane.style.display = on ? 'flex' : 'none'; else pane.hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t.id));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      showTab(next.id); next.focus();
    });
  });
  const vp = mode => {
    $('#stage').dataset.vp = mode;
    $('#vpDesk').setAttribute('aria-pressed', String(mode === 'desk'));
    $('#vpPhone').setAttribute('aria-pressed', String(mode === 'phone'));
  };
  $('#vpDesk').addEventListener('click', () => vp('desk'));
  $('#vpPhone').addEventListener('click', () => vp('phone'));
  $('#reload').addEventListener('click', () => { const f = $('#frame'); f.src = f.getAttribute('src'); });
  function buildFiles() {
    const pane = $('#pane-files');
    const items = $$('[data-file]', view(current)).map(el => ({
      from: el.dataset.file,
      name: el.dataset.name || $('.att-n', el)?.textContent || '',
      meta: el.dataset.meta || $('.att-m', el)?.textContent || '',
    }));
    if (!items.length) { pane.innerHTML = '<p>V této konverzaci zatím nejsou žádné soubory.</p>'; return; }
    const kind = n => /\.(png|jpe?g|webp)$/i.test(n) ? 'image' : /\.csv$/i.test(n) ? 'sheet' : 'file';
    const groups = {};
    items.forEach(it => (groups[it.from] ||= []).push(it));
    pane.innerHTML = Object.entries(groups).map(([from, list]) =>
      `<h3>${from === 'zadání' ? 'Přílohy zadání' : 'Výstupy v odpovědi'}</h3>` + list.map(it =>
        `<div class="att">${icon(kind(it.name), 'i')}<span><span class="att-n">${esc(it.name)}</span><span class="att-m num">${esc(it.meta)}</span></span></div>`).join('')).join('');
  }

  /* ---------- Výběr modelu a uvažování ---------- */
  const pop = $('#modelPop'), modelBtn = $('#modelBtn');
  const openPop = () => {
    pop.dataset.open = 'true';
    modelBtn.setAttribute('aria-expanded', 'true');
    $('input[name="model"]:checked', pop).focus();
  };
  function closePop(refocus = true) {
    if (pop.dataset.open !== 'true') return;
    pop.dataset.open = 'false';
    modelBtn.setAttribute('aria-expanded', 'false');
    if (refocus) modelBtn.focus();
  }
  modelBtn.addEventListener('click', () => pop.dataset.open === 'true' ? closePop() : openPop());
  pop.addEventListener('change', () => {
    const [acct, model] = $('input[name="model"]:checked', pop).value.split('|');
    $('#acctLabel').textContent = acct;
    $('#modelLabel').textContent = model;
    $('#effortLabel').textContent = $('input[name="effort"]:checked', pop).value;
  });
  document.addEventListener('pointerdown', e => {
    if (pop.dataset.open === 'true' && !pop.contains(e.target) && !modelBtn.contains(e.target) && !e.target.closest('[data-open-model]')) closePop(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (pop.dataset.open === 'true') return closePop();
    if (app.dataset.drawer === 'open') return closeDrawer();
    if (app.dataset.panel === 'open' && !wide()) { panelTouched = true; setPanel(false); (phone() ? panelBtnM : panelBtn).focus(); }
  });

  /* ---------- Fronta ---------- */
  const qWord = n => n === 1 ? 'zpráva' : n < 5 ? 'zprávy' : 'zpráv';
  const paintQueue = () => {
    const card = $('[data-queue]'), rows = $$('.q', card);
    card.hidden = rows.length === 0;
    rows.forEach((r, i) => { $('.n', r).textContent = i + 1; });
    $('[data-qcount]', card).textContent = rows.length === 1
      ? '1 zpráva, odešle se po doběhnutí'
      : `${rows.length} ${qWord(rows.length)}, odešlou se po doběhnutí popořadě`;
  };
  const qRow = text => `<li class="q"><span class="n num"></span><p>${esc(text)}</p><span class="q-acts">
    <button class="icon-btn" data-q="now" aria-label="Poslat do běhu hned" title="Poslat do běhu hned">${icon('arrow-up')}</button>
    <button class="icon-btn" data-q="edit" aria-label="Upravit zprávu" title="Upravit">${icon('pencil')}</button>
    <button class="icon-btn" data-q="del" aria-label="Odebrat z fronty" title="Odebrat">${icon('x')}</button></span></li>`;

  /* ---------- Běh: zastavit, pokračovat, schválit ---------- */
  const setStatus = (v, mark, html) => {
    const root = view(v);
    $('[data-smark]', root).className = 'mark ' + mark;
    $('[data-stext]', root).innerHTML = html;
  };
  const toggleRun = () => {
    running = !running;
    const root = view('beh');
    $$('[data-live]', root).forEach(li => {
      li.className = 'stop ' + (running ? 'is-run' : 'is-hold');
      $('.mark', li).className = 'mark ' + (running ? 'run' : 'hold');
      $('[data-state]', li).textContent = running ? 'probíhá' : 'zastaveno';
    });
    $('[data-lane]', root).textContent = running ? 'Souběžně, obsazená 2 místa ze 3' : 'Zastaveno uprostřed dvou souběžných zastávek';
    $('[data-runmeta]', root).textContent = running ? '3. zastávka z 6 · 4:31' : '3. zastávka z 6 · zastaveno';
    setStatus('beh', running ? 'run' : 'hold', running
      ? '<b>3. zastávka z 6</b> · Runa a Nodi pracují souběžně'
      : '<b>Běh zastaven na 3. zastávce</b> · hotová práce zůstala uložená');
    $('[data-stop]', root).innerHTML = running ? icon('stop') + 'Zastavit' : icon('play') + 'Pokračovat';
    $('.mel-head img', root).src = `assets/mel/mel-32-${running ? 'working' : 'waiting'}.svg`;
    setSidebar('beh', running ? 'run' : 'hold', running ? '3. zastávka z 6' : 'zastaveno na 3. zastávce');
    paintSend();
  };

  const paintScope = () => {
    const root = view('schvaleni');
    const files = $$('.file', root);
    const left = files.filter(f => f.dataset.state !== 'reverted').length;
    const scope = $('[data-scope]', root), yes = $('[data-gate="yes"]', root);
    if (scope) scope.textContent = left === 0 ? 'Žádný soubor k nahrání, všechny změny jsou vrácené'
      : `${left} ${left === 1 ? 'změněný soubor' : 'změněné soubory'}, nic se nemaže`;
    if (yes) yes.disabled = left === 0, yes.style.opacity = left === 0 ? '.5' : '';
    $('[data-accept-all]', root).hidden = !files.some(f => f.dataset.state === 'pending');
  };
  const setFile = (file, state) => {
    file.dataset.state = state;
    const res = $('[data-res]', file);
    res.textContent = state === 'accepted' ? 'přijato' : state === 'reverted' ? 'vráceno' : '';
    res.className = 'pill res' + (state === 'accepted' ? ' ok' : '');
    paintScope();
  };
  const gate = ok => {
    const root = view('schvaleni');
    $('[data-gate-open]', root).hidden = true;
    const done = $('[data-gate-done]', root);
    done.hidden = false;
    const stop = $('[data-gatestop]', root);
    if (ok) {
      done.innerHTML = `<span class="pill ok">schváleno</span>Schváleno v ${now()}. Juno nahrává na test`;
      $('#gate h2').textContent = 'Nahrání na test';
      stop.className = 'stop is-run'; $('.mark', stop).className = 'mark run'; $('[data-state]', stop).textContent = 'probíhá';
      $('[data-runmeta]', root).textContent = '4. zastávka z 4 · běží';
      setStatus('schvaleni', 'run', '<b>4. zastávka z 4</b> · Juno nahrává na test');
      $('[data-melimg]', root).src = 'assets/mel/mel-32-working.svg';
      setSidebar('schvaleni', 'run', '4. zastávka z 4');
    } else {
      done.innerHTML = `<span class="pill">zamítnuto</span>Zamítnuto v ${now()}. Běh skončil před nahráním, změny zůstaly v pracovní kopii`;
      $('#gate h2').textContent = 'Nahrání na test';
      stop.className = 'stop is-next'; $('.mark', stop).className = 'mark next'; $('[data-state]', stop).textContent = 'zamítnuto';
      $('[data-runmeta]', root).textContent = '3 zastávky ze 4 · skončeno';
      setStatus('schvaleni', 'done', '<b>Běh skončil před nahráním</b> · zamítnuto');
      $('[data-melimg]', root).src = 'assets/mel/mel-32-idle.svg';
      setSidebar('schvaleni', 'done', 'zamítnuto, bez nahrání');
      view('schvaleni').dataset.send = 'Odeslat';
    }
    $('[data-goto]', root).hidden = true;
    paintSend();
  };
  const resume = () => {
    const root = view('preruseno');
    $('[data-fail-open]', root).hidden = true;
    $('[data-fail-done]', root).hidden = false;
    $('#fail h2').textContent = 'Běh pokračuje';
    $('#fail .card-head .i').style.display = 'none';
    const stop = $('[data-errstop]', root);
    stop.className = 'stop is-run'; $('.mark', stop).className = 'mark run'; $('[data-state]', stop).textContent = 'probíhá';
    $('[data-runmeta]', root).textContent = '3. zastávka z 4 · běží';
    setStatus('preruseno', 'run', '<b>3. zastávka z 4</b> · Flux zmenšuje fotky, 9 z 24 hotových');
    $$('[data-resume]', root).forEach(b => { if (b.closest('.status')) b.hidden = true; });
    $('[data-melimg]', root).src = 'assets/mel/mel-32-working.svg';
    setSidebar('preruseno', 'run', '3. zastávka z 4');
  };

  /* ---------- Přílohy v zadání ---------- */
  const staged = $('#staged'), fileInput = $('#fileInput');
  $('#attach').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    for (const f of fileInput.files) {
      if ($$('.att', staged).length >= 5) { toast('Nejvýš 5 příloh'); break; }
      const img = f.type.startsWith('image/');
      const ext = (f.name.split('.').pop() || '').toUpperCase().slice(0, 5);
      const size = f.size < 1024 * 1024 ? Math.max(1, Math.round(f.size / 1024)) + ' kB' : (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB';
      const el = document.createElement('div');
      el.className = 'att';
      el.innerHTML = (img ? `<img class="att-thumb" alt="" src="${URL.createObjectURL(f)}">` : icon(/csv|xls/i.test(ext) ? 'sheet' : 'file', 'i')) +
        `<span><span class="att-n">${esc(f.name)}</span><span class="att-m num">${esc(ext)} · ${size}</span></span>` +
        `<button type="button" class="icon-btn x" data-unstage aria-label="Odebrat přílohu ${esc(f.name)}">${icon('x')}</button>`;
      staged.append(el);
    }
    staged.hidden = !staged.children.length;
    fileInput.value = '';
  });

  /* ---------- Odeslání ---------- */
  const prompt = $('#prompt'), composer = $('#composer');
  const submit = () => {
    const text = prompt.value.trim();
    if (!text && !staged.children.length) {
      composer.classList.add('nudge'); prompt.focus();
      setTimeout(() => composer.classList.remove('nudge'), 700);
      return;
    }
    if (current === 'beh' && running) {
      $('[data-qlist]').insertAdjacentHTML('beforeend', qRow(text || 'Přílohy bez textu'));
      paintQueue();
      $('[data-queue]').open = true;
      toast('Zařazeno do fronty');
    } else if (current === 'nove') {
      toast('Ukázka zadání neodesílá. Rozjetý běh najdeš v konverzaci Ceník na web');
      return;
    } else {
      const col = $('.col', view(current));
      col.insertAdjacentHTML('beforeend', `<div class="msg-user"><p class="bubble">${esc(text || 'Přílohy bez textu')}</p><span class="stamp num">${now()} · ukázka, nový běh se nespustí</span></div>`);
      const thread = $('.thread', view(current)); thread.scrollTop = thread.scrollHeight;
    }
    prompt.value = ''; staged.innerHTML = ''; staged.hidden = true;
  };
  // Pole roste s textem; výška se nastavuje naráz, bez animace rozměrů.
  const fit = () => { prompt.style.height = ''; if (prompt.value) prompt.style.height = Math.min(prompt.scrollHeight, 192) + 'px'; };
  prompt.addEventListener('input', fit);
  composer.addEventListener('submit', e => { e.preventDefault(); submit(); fit(); });
  prompt.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); fit(); }
  });

  /* ---------- Delegované akce ---------- */
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-outside]')) return toast('Návrh pokrývá jen chat, tahle část zůstává beze změny');
    if (t.matches('[data-toast]')) return toast(t.dataset.toast);
    if (t.matches('[data-fill]')) { prompt.value = t.dataset.fill; fit(); prompt.focus(); prompt.setSelectionRange(prompt.value.length, prompt.value.length); return; }
    if (t.matches('[data-unstage]')) { t.closest('.att').remove(); staged.hidden = !staged.children.length; return; }
    if (t.matches('.file-toggle')) {
      const open = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', String(open));
      document.getElementById(t.getAttribute('aria-controls')).hidden = !open;
      return;
    }
    if (t.matches('[data-file-act]')) return setFile(t.closest('.file'), t.dataset.fileAct);
    if (t.matches('[data-accept-all]')) return $$('.file[data-state="pending"]', view('schvaleni')).forEach(f => setFile(f, 'accepted'));
    if (t.matches('[data-gate]')) return gate(t.dataset.gate === 'yes');
    if (t.matches('[data-resume]')) return resume();
    if (t.matches('[data-stop]')) return toggleRun();
    if (t.matches('[data-open-model]')) return openPop();
    if (t.matches('[data-goto]')) { const el = document.getElementById(t.dataset.goto); el.scrollIntoView({block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); el.focus({preventScroll: true}); return; }
    if (t.matches('[data-open-preview]')) { panelTouched = true; showTab('tab-web'); return setPanel(true); }
    if (t.matches('button.att[data-file]')) { panelTouched = true; showTab('tab-files'); return setPanel(true); }
    if (t.matches('[data-q]')) {
      const row = t.closest('.q'), text = $('p', row).textContent;
      if (t.dataset.q === 'edit') { prompt.value = text; fit(); prompt.focus(); }
      if (t.dataset.q === 'now') toast('Posláno do běhu, mimo pořadí');
      row.remove(); paintQueue();
      return;
    }
    if (t.matches('[data-copy]')) {
      const text = $('.prose', t.closest('.msg-mel'))?.textContent || '';
      try { await navigator.clipboard.writeText(text); } catch {}
      const label = $('span', t), old = label.textContent;
      label.textContent = 'Zkopírováno';
      setTimeout(() => { label.textContent = old; }, 1600);
    }
  });

  addEventListener('hashchange', route);
  route();
})();
