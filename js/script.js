const imgs = { orig: null, saidas: null, final: null };

const FORRAGEM_CLASS = { muito: 'badge-forragem-muito', mediano: 'badge-forragem-mediano', pouco: 'badge-forragem-pouco' };
const FORRAGEM_LABEL = { muito: 'Muito', mediano: 'Mediano', pouco: 'Pouco' };

function onFile(e, slot) {
  const f = e.target.files[0];
  if (!f) return;
  const nameMap = { orig: 'uploadName1', saidas: 'uploadName2', final: 'uploadName3' };
  const prevMap = { orig: 'uploadPrev1', saidas: 'uploadPrev2', final: 'uploadPrev3' };
  document.getElementById(nameMap[slot]).textContent = f.name;
  document.getElementById(nameMap[slot]).style.display = 'block';
  const r = new FileReader();
  r.onload = ev => {
    imgs[slot] = ev.target.result;
    const prev = document.getElementById(prevMap[slot]);
    prev.src = ev.target.result;
    prev.style.display = 'block';
  };
  r.readAsDataURL(f);
}

function g(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildCarousel(wrapId, text, cardClass) {
  const wrap = g(wrapId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const lines = (text || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const source = lines;

  if (!source.length) {
    const card = document.createElement('div');
    card.className = 'c-card ' + cardClass;
    card.innerHTML = '<div class="c-reason">—</div>';
    wrap.appendChild(card);
    return;
  }

  source.forEach(line => {
    const clean = line.replace(/^-\s*/, '');
    const m = clean.match(/^(.+?):\s*(.+)$/);
    const card = document.createElement('div');
    card.className = 'c-card ' + cardClass;
    if (m) {
      card.innerHTML =
        '<span class="c-name">' + escapeHtml(m[1]) + '</span>' +
        '<span class="c-sep"> — </span>' +
        '<span class="c-reason">' + escapeHtml(m[2]) + '</span>';
    } else {
      card.innerHTML = '<span class="c-reason">' + escapeHtml(clean) + '</span>';
    }
    wrap.appendChild(card);
  });
}

let _carouselTimers = [];

function clearCarouselTimers() {
  _carouselTimers.forEach(t => clearTimeout(t));
  _carouselTimers = [];
}

function startCarousel(wrapId) {
  const wrap = g(wrapId);
  if (!wrap) return;
  const cards = Array.from(wrap.querySelectorAll('.c-card'));
  if (!cards.length) return;

  function showCard(i) {
    if (i > 0 && cards[i - 1]) {
      cards[i - 1].classList.remove('c-active');
      cards[i - 1].classList.add('c-exit');
    }
    if (i < cards.length) {
      cards[i].classList.add('c-active');
      const t = setTimeout(() => showCard(i + 1), 1500);
      _carouselTimers.push(t);
    }
  }
  showCard(0);
}

function sP(sfx, t) {
  const b = g('progressBar' + sfx);
  if (!b) return;
  b.style.transition = 'none';
  b.style.width = '0%';
  let st = null;
  function step(ts) {
    if (!st) st = ts;
    const p = Math.min((ts - st) / t, 1);
    b.style.width = (p * 100) + '%';
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function flash(sfx, cb) {
  const f = g('flash' + sfx);
  f.classList.remove('scanning');
  void f.offsetHeight;
  f.classList.add('scanning');
  if (cb) setTimeout(cb, 380);
  setTimeout(() => f.classList.remove('scanning'), 750);
}

function mF(sfx, n, iv, cb) {
  flash(sfx, cb);
}

function aIn(id, d) {
  setTimeout(() => { const el = g(id); if (el) el.classList.add('in'); }, d);
}

function cardCount(wrapId) {
  const wrap = g(wrapId);
  return wrap ? Math.max(1, wrap.querySelectorAll('.c-card').length) : 1;
}

function rAll(sfx) {
  clearCarouselTimers();
  ['saidasCard' + sfx, 'chegadasCard' + sfx].forEach(id => {
    const wrap = g(id);
    if (wrap) wrap.querySelectorAll('.c-card').forEach(c => c.classList.remove('c-active', 'c-exit'));
  });
  [
    'anlTag', 'galanTag', 'teamWrap', 'metaBadges', 'stickerWrap',
    'actSaidas', 'saidasPhotoWrap', 'saidasTitle',
    'actChegadas', 'chegadasPhotoWrap', 'chegadasTitle',
    'actCta', 'cTL', 'cTR', 'cBL', 'cBR'
  ].forEach(id => { const el = g(id + sfx); if (el) el.classList.remove('in'); });
}

function prepData(sfx) {
  if (imgs.orig)   { g('teamImgOrig'     + sfx).src = imgs.orig; }
  if (imgs.saidas) { g('teamImgSaidas'   + sfx).src = imgs.saidas; }
  if (imgs.final)  { g('teamImgChegadas' + sfx).src = imgs.final; }

  const coinsVal = g('fCoins').value.trim() || '—';
  g('badgeCoins' + sfx).textContent = '💰 ' + coinsVal;

  const fKey = g('fForragem').value;
  const fBadge = g('badgeForragem' + sfx);
  fBadge.textContent = 'Forragem: ' + FORRAGEM_LABEL[fKey];
  fBadge.className = 'badge ' + FORRAGEM_CLASS[fKey];

  buildCarousel('saidasCard'   + sfx, g('fSaidas').value   || '', 'c-card-saidas');
  buildCarousel('chegadasCard' + sfx, g('fChegadas').value || '', 'c-card-chegadas');

  const tema = g('fTema') ? g('fTema').value.trim() : '';
  const stickerText = g('stickerText' + sfx);
  const stickerWrap = g('stickerWrap' + sfx);
  if (stickerText) stickerText.textContent = tema;
  if (stickerWrap) stickerWrap.style.display = tema ? '' : 'none';

  const epNum = parseInt((g('fEp') && g('fEp').value.trim()) || '1');
  const epPad = String(epNum).padStart(2, '0');
  const epBadge = g('epIntroBadge');
  if (epBadge) epBadge.innerHTML = '<span class="ep-label">EP</span><span class="ep-num">' + epPad + '</span><span class="ep-arrow">▸</span>';
}

function runAnim(sfx) {
  const CARD_DUR = 1500;
  const OVERHEAD = 1700; // flash(380) + carousel delay(1200) + buffer(120)
  const MIN_SCR  = 4500;

  const nS = cardCount('saidasCard'   + sfx);
  const nC = cardCount('chegadasCard' + sfx);
  const durS = Math.max(MIN_SCR, OVERHEAD + nS * CARD_DUR);
  const durC = Math.max(MIN_SCR, OVERHEAD + nC * CARD_DUR);

  const T1 = 3000;
  const T2 = T1 + durS;
  const T3 = T2 + durC;
  const TD = T3 + 5000;

  sP(sfx, TD);
  flash(sfx);

  // Tela 1 — Time Original
  aIn('anlTag'      + sfx, 200);
  aIn('galanTag'    + sfx, 200);
  aIn('teamWrap'    + sfx, 650);
  aIn('metaBadges'  + sfx, 2200);
  const tema = g('fTema') ? g('fTema').value.trim() : '';
  if (tema) aIn('stickerWrap' + sfx, 3000);

  // Tela 2 — Saídas
  setTimeout(() => {
    mF(sfx, 2, 110, () => {
      aIn('actSaidas'       + sfx, 0);
      aIn('saidasTitle'     + sfx, 200);
      aIn('saidasPhotoWrap' + sfx, 650);
      setTimeout(() => startCarousel('saidasCard' + sfx), 1200);
    });
  }, T1);

  // Tela 3 — Chegadas
  setTimeout(() => {
    mF(sfx, 2, 110, () => {
      aIn('actChegadas'      + sfx, 0);
      aIn('chegadasTitle'    + sfx, 200);
      aIn('chegadasPhotoWrap'+ sfx, 650);
      setTimeout(() => startCarousel('chegadasCard' + sfx), 1200);
    });
  }, T2);

  // Tela 4 — CTA
  setTimeout(() => {
    mF(sfx, 3, 110, () => {
      aIn('actCta'    + sfx, 0);
      aIn('cTL' + sfx, 200);
      aIn('cTR' + sfx, 260);
      aIn('cBL' + sfx, 320);
      aIn('cBR' + sfx, 380);
    });
  }, T3);

  return TD;
}

function playAnimation() {
  rAll('');
  prepData('');
  setTimeout(() => runAnim(''), 100);
}

function replay() {
  rAll('');
  prepData('');
  setTimeout(() => runAnim(''), 100);
}

let _fsCloseTimer = null;

function openFullscreen() {
  rAll('FS');
  prepData('FS');

  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
  g('fsClose').style.display = 'none';

  const wrap = g('fsSceneWrap');
  const sw = window.innerWidth, sh = window.innerHeight;
  if (sw / sh > 9 / 16) {
    wrap.style.height = sh + 'px';
    wrap.style.width  = (sh * 9 / 16) + 'px';
  } else {
    wrap.style.width  = sw + 'px';
    wrap.style.height = (sw * 16 / 9) + 'px';
  }

  g('introTeamImg').src = imgs.orig || '';
  g('fsOverlay').classList.add('open');

  const intro = g('fsIntro');
  const epBadge = g('epIntroBadge');
  setTimeout(() => { intro.classList.add('in'); if (epBadge) epBadge.classList.add('in'); }, 50);
  setTimeout(() => { intro.classList.remove('in'); if (epBadge) epBadge.classList.remove('in'); }, 2000);
  setTimeout(() => {
    const td = runAnim('FS');
    _fsCloseTimer = setTimeout(() => { g('fsClose').style.display = 'block'; }, td + 200);
  }, 2500);
}

function closeFullscreen() {
  g('fsOverlay').classList.remove('open');
  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
}

function replayFS() {
  rAll('FS');
  prepData('FS');
  setTimeout(() => runAnim('FS'), 100);
}
