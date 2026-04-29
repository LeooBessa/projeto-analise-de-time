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

function parsePlayers(text) {
  return (text || '').split('\n')
    .map(l => l.trim().replace(/^-\s*/, ''))
    .filter(l => l.length > 0)
    .map(l => {
      const m = l.match(/^(.+?):\s*(.+)$/);
      return m ? { name: m[1].trim(), reason: m[2].trim() } : { name: l, reason: '' };
    });
}

let _badgeTimers = [];

function clearBadgeTimers() {
  _badgeTimers.forEach(t => clearTimeout(t));
  _badgeTimers = [];
}

function runBadges(areaId, players, type) {
  const area = g(areaId);
  if (!area || !players.length) return;
  area.innerHTML = '';

  const BADGE_DUR = 1800;
  const icon = type === 'saida' ? '❌' : '✅';

  players.forEach((player, i) => {
    const badge = document.createElement('div');
    badge.className = 'tb tb-' + type;
    badge.innerHTML =
      '<span class="tb-icon">' + icon + '</span>' +
      '<div class="tb-text">' +
        '<div class="tb-name">' + escapeHtml(player.name) + '</div>' +
        (player.reason ? '<div class="tb-reason">' + escapeHtml(player.reason) + '</div>' : '') +
      '</div>';
    area.appendChild(badge);

    const tIn = setTimeout(() => badge.classList.add('in'), i * BADGE_DUR + 50);
    _badgeTimers.push(tIn);

    if (i < players.length - 1) {
      const tOut = setTimeout(() => {
        badge.classList.remove('in');
        badge.classList.add('out');
      }, i * BADGE_DUR + 1500);
      _badgeTimers.push(tOut);
    }
  });
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
  if (!f) { if (cb) setTimeout(cb, 380); return; }
  f.classList.remove('scanning');
  void f.offsetHeight;
  f.classList.add('scanning');
  if (cb) setTimeout(cb, 380);
  setTimeout(() => f.classList.remove('scanning'), 750);
}

function mF(sfx, n, iv, cb) { flash(sfx, cb); }

function aIn(id, d) {
  setTimeout(() => { const el = g(id); if (el) el.classList.add('in'); }, d);
}

function rAll(sfx) {
  clearBadgeTimers();

  const area = g('transferArea' + sfx);
  if (area) area.innerHTML = '';

  const pl = g('phaseLabel' + sfx);
  if (pl) { pl.className = 'phase-label'; pl.textContent = ''; }

  const img = g('teamImgOrig' + sfx);
  if (img && imgs.orig) img.src = imgs.orig;

  ['anlTag', 'galanTag', 'teamWrap', 'metaBadges', 'actCta', 'cTL', 'cTR', 'cBL', 'cBR']
    .forEach(id => { const el = g(id + sfx); if (el) el.classList.remove('in'); });
}

function prepData(sfx) {
  const imgOrig = g('teamImgOrig' + sfx);
  if (imgOrig && imgs.orig) imgOrig.src = imgs.orig;

  const coinsEl   = g('fCoins');
  const badgeCoin = g('badgeCoins' + sfx);
  if (badgeCoin) badgeCoin.textContent = '💰 ' + (coinsEl ? coinsEl.value.trim() || '—' : '—');

  const fForragemEl = g('fForragem');
  const fBadge = g('badgeForragem' + sfx);
  if (fBadge && fForragemEl) {
    const fKey = fForragemEl.value;
    fBadge.textContent = 'Forragem: ' + FORRAGEM_LABEL[fKey];
    fBadge.className = 'badge ' + FORRAGEM_CLASS[fKey];
  }

  const tema = g('fTema') ? g('fTema').value.trim() : '';
  const stickerText = g('stickerText');
  const stickerWrap = g('stickerWrap');
  if (stickerText) stickerText.textContent = tema;
  if (stickerWrap) stickerWrap.style.display = tema ? '' : 'none';

  const epNum = parseInt((g('fEp') && g('fEp').value.trim()) || '1');
  const epPad = String(epNum).padStart(2, '0');
  const epBadge = g('epIntroBadge');
  if (epBadge) epBadge.innerHTML = '<span class="ep-label">EP</span><span class="ep-num">' + epPad + '</span><span class="ep-arrow">▸</span>';
}

function runAnim(sfx) {
  const saidas   = parsePlayers(g('fSaidas').value   || '');
  const chegadas = parsePlayers(g('fChegadas').value || '');

  const BADGE_DUR  = 1800;
  const PHASE_PAD  = 600;
  const SETUP_DUR  = 2200;
  const CTA_DUR    = 5000;

  const durSaidas   = Math.max(saidas.length,   1) * BADGE_DUR + 400;
  const durChegadas = Math.max(chegadas.length, 1) * BADGE_DUR + 400;

  const T_SAIDAS   = SETUP_DUR;
  const T_SWITCH1  = T_SAIDAS   + durSaidas;
  const T_CHEGADAS = T_SWITCH1  + PHASE_PAD;
  const T_SWITCH2  = T_CHEGADAS + durChegadas;
  const T_CTA      = T_SWITCH2  + PHASE_PAD + 800;
  const TD         = T_CTA      + CTA_DUR;

  sP(sfx, TD);
  flash(sfx);

  aIn('anlTag'     + sfx, 200);
  aIn('galanTag'   + sfx, 200);
  aIn('teamWrap'   + sfx, 650);
  aIn('metaBadges' + sfx, 1200);

  setTimeout(() => {
    const mb = g('metaBadges' + sfx);
    if (mb) mb.classList.remove('in');
  }, T_SAIDAS - 400);

  // SAÍDAS
  setTimeout(() => {
    const pl = g('phaseLabel' + sfx);
    if (pl) { pl.className = 'phase-label pl-saidas'; void pl.offsetHeight; pl.classList.add('in'); }
    runBadges('transferArea' + sfx, saidas, 'saida');
  }, T_SAIDAS);

  setTimeout(() => {
    const pl = g('phaseLabel' + sfx);
    if (pl) pl.classList.remove('in');
    const area = g('transferArea' + sfx);
    if (area) area.innerHTML = '';
    flash(sfx, () => {
      const img = g('teamImgOrig' + sfx);
      if (img && imgs.saidas) img.src = imgs.saidas;
    });
  }, T_SWITCH1);

  // CHEGADAS
  setTimeout(() => {
    const pl = g('phaseLabel' + sfx);
    if (pl) { pl.className = 'phase-label pl-chegadas'; void pl.offsetHeight; pl.classList.add('in'); }
    runBadges('transferArea' + sfx, chegadas, 'chegada');
  }, T_CHEGADAS);

  setTimeout(() => {
    const pl = g('phaseLabel' + sfx);
    if (pl) pl.classList.remove('in');
    const area = g('transferArea' + sfx);
    if (area) area.innerHTML = '';
    flash(sfx, () => {
      const img = g('teamImgOrig' + sfx);
      if (img && imgs.final) img.src = imgs.final;
    });
  }, T_SWITCH2);

  // CTA
  setTimeout(() => {
    mF(sfx, 3, 110, () => {
      aIn('actCta' + sfx, 0);
      aIn('cTL'    + sfx, 200);
      aIn('cTR'    + sfx, 260);
      aIn('cBL'    + sfx, 320);
      aIn('cBR'    + sfx, 380);
    });
  }, T_CTA);

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

  const intro   = g('fsIntro');
  const epBadge = g('epIntroBadge');
  const sticker = g('stickerWrap');
  setTimeout(() => { intro.classList.add('in'); if (epBadge) epBadge.classList.add('in'); if (sticker) sticker.classList.add('in'); }, 50);
  setTimeout(() => { intro.classList.remove('in'); if (epBadge) epBadge.classList.remove('in'); if (sticker) sticker.classList.remove('in'); }, 1200);
  setTimeout(() => {
    const td = runAnim('FS');
    _fsCloseTimer = setTimeout(() => { g('fsClose').style.display = 'block'; }, td + 200);
  }, 1600);
}

function closeFullscreen() {
  g('fsOverlay').classList.remove('open');
  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
}
