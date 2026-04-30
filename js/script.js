const imgs = {
  orig: null,
  final: null,
  alts: Array.from({ length: 5 }, () => ({ saida: null, chegada: null }))
};

const FORRAGEM_CLASS = { muito: 'badge-forragem-muito', mediano: 'badge-forragem-mediano', pouco: 'badge-forragem-pouco' };
const FORRAGEM_LABEL = { muito: 'Muito', mediano: 'Mediano', pouco: 'Pouco' };

function onFile(e, type, altIdx, side) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    const data = ev.target.result;
    if (type === 'orig') {
      imgs.orig = data;
      showPrev('uploadPrev1', 'uploadName1', data, f.name);
    } else if (type === 'final') {
      imgs.final = data;
      showPrev('uploadPrev2', 'uploadName2', data, f.name);
    } else if (type === 'alt') {
      imgs.alts[altIdx][side] = data;
      showPrev('altPrev_' + altIdx + '_' + side, null, data, null);
    }
  };
  r.readAsDataURL(f);
}

function showPrev(prevId, nameId, src, name) {
  const prev = g(prevId);
  if (prev) { prev.src = src; prev.style.display = 'block'; }
  if (nameId) {
    const nameEl = g(nameId);
    if (nameEl && name) { nameEl.textContent = name; nameEl.style.display = 'block'; }
  }
}

function g(id) { return document.getElementById(id); }

function getAlts() {
  const result = [];
  for (let i = 0; i < 5; i++) {
    const ns = ((g('altSaidaName'   + (i + 1)) || {}).value || '').trim();
    const nc = ((g('altChegadaName' + (i + 1)) || {}).value || '').trim();
    const ph = ((g('altPhrase'      + (i + 1)) || {}).value || '').trim();
    if (ns || nc || imgs.alts[i].saida || imgs.alts[i].chegada) {
      result.push({ saidaName: ns, chegadaName: nc, phrase: ph, saidaImg: imgs.alts[i].saida, chegadaImg: imgs.alts[i].chegada });
    }
  }
  return result;
}

function setAltContent(sfx, alt) {
  const imgS = g('altImgSaida'    + sfx); if (imgS) imgS.src = alt.saidaImg   || '';
  const imgC = g('altImgChegada'  + sfx); if (imgC) imgC.src = alt.chegadaImg || '';
  const nS   = g('altNameSaida'   + sfx); if (nS)   nS.textContent  = alt.saidaName;
  const nC   = g('altNameChegada' + sfx); if (nC)   nC.textContent  = alt.chegadaName;
  const ph   = g('altPhrase'      + sfx); if (ph)   ph.textContent  = alt.phrase;
}

let _animTimers = [];
function clearAnimTimers() {
  _animTimers.forEach(t => clearTimeout(t));
  _animTimers = [];
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

function aIn(id, d) {
  const t = setTimeout(() => { const el = g(id); if (el) el.classList.add('in'); }, d);
  _animTimers.push(t);
}

function rAll(sfx) {
  clearAnimTimers();
  const img = g('teamImgOrig' + sfx);
  if (img && imgs.orig) img.src = imgs.orig;
  ['anlTag', 'teamWrap', 'actAlt', 'actCta', 'cTL', 'cTR', 'cBL', 'cBR']
    .forEach(id => { const el = g(id + sfx); if (el) el.classList.remove('in'); });
}

function prepData(sfx) {
  const imgOrig = g('teamImgOrig' + sfx);
  if (imgOrig && imgs.orig) imgOrig.src = imgs.orig;
}

function prepIntro() {
  const coinsEl = g('fCoins');
  const cBadge  = g('introCoinsBadge');
  if (cBadge) cBadge.textContent = '💰 ' + (coinsEl ? coinsEl.value.trim() || '—' : '—');

  const fForragemEl = g('fForragem');
  const fBadge      = g('introForragemBadge');
  if (fBadge && fForragemEl) {
    const fKey = fForragemEl.value;
    fBadge.textContent = 'Forragem: ' + FORRAGEM_LABEL[fKey];
    fBadge.className = 'intro-badge-item ' + FORRAGEM_CLASS[fKey];
  }

  const tema        = g('fTema') ? g('fTema').value.trim() : '';
  const stickerText = g('stickerText');
  const stickerWrap = g('stickerWrap');
  if (stickerText) stickerText.textContent = tema;
  if (stickerWrap) stickerWrap.style.display = tema ? '' : 'none';

  const epNum   = parseInt((g('fEp') && g('fEp').value.trim()) || '1');
  const epPad   = String(epNum).padStart(2, '0');
  const epBadge = g('epIntroBadge');
  if (epBadge) epBadge.innerHTML = '<span class="ep-label">EP</span><span class="ep-num">' + epPad + '</span><span class="ep-arrow">▸</span>';
}

function runAnim(sfx) {
  const alts = getAlts();

  const ALT_DUR = 3500;
  const CTA_DUR = 5000;

  const T_FIRST_ALT = 300;
  const T_CTA       = T_FIRST_ALT + alts.length * ALT_DUR + (alts.length > 0 ? 800 : 300);
  const TD          = T_CTA + CTA_DUR;

  sP(sfx, TD);
  flash(sfx);

  alts.forEach((alt, i) => {
    const tStart = T_FIRST_ALT + i * ALT_DUR;
    const tEnd   = tStart + ALT_DUR - 400;

    const tS = setTimeout(() => {
      setAltContent(sfx, alt);
      const el = g('actAlt' + sfx);
      if (el) { el.classList.remove('in'); void el.offsetHeight; }
      flash(sfx, () => {
        const el2 = g('actAlt' + sfx);
        if (el2) el2.classList.add('in');
      });
    }, tStart);
    _animTimers.push(tS);

    const tE = setTimeout(() => {
      const el = g('actAlt' + sfx);
      if (el) el.classList.remove('in');
    }, tEnd);
    _animTimers.push(tE);
  });

  const tCta = setTimeout(() => {
    flash(sfx, () => {
      aIn('actCta' + sfx, 0);
      aIn('cTL'    + sfx, 200);
      aIn('cTR'    + sfx, 260);
      aIn('cBL'    + sfx, 320);
      aIn('cBR'    + sfx, 380);
    });
  }, T_CTA);
  _animTimers.push(tCta);

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
  prepIntro();

  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
  const fsClose = g('fsClose');
  if (fsClose) fsClose.style.display = 'none';

  const wrap = g('fsSceneWrap');
  const sw = window.innerWidth, sh = window.innerHeight;
  if (sw / sh > 9 / 16) {
    wrap.style.height = sh + 'px';
    wrap.style.width  = (sh * 9 / 16) + 'px';
  } else {
    wrap.style.width  = sw + 'px';
    wrap.style.height = (sw * 16 / 9) + 'px';
  }

  const introTeam = g('introTeamImg');
  if (introTeam) introTeam.src = imgs.orig || '';
  g('fsOverlay').classList.add('open');

  const intro   = g('fsIntro');
  const epBadge = g('epIntroBadge');
  const sticker = g('stickerWrap');
  const cBadge  = g('introCoinsBadge');
  const fBadge  = g('introForragemBadge');

  setTimeout(() => {
    if (intro)   intro.classList.add('in');
    if (epBadge) epBadge.classList.add('in');
    if (sticker) sticker.classList.add('in');
    if (cBadge)  cBadge.classList.add('in');
    if (fBadge)  fBadge.classList.add('in');
  }, 50);
  setTimeout(() => {
    if (intro)   intro.classList.remove('in');
    if (epBadge) epBadge.classList.remove('in');
    if (sticker) sticker.classList.remove('in');
    if (cBadge)  cBadge.classList.remove('in');
    if (fBadge)  fBadge.classList.remove('in');
  }, 1200);
  setTimeout(() => {
    const td = runAnim('FS');
    _fsCloseTimer = setTimeout(() => {
      const fc = g('fsClose');
      if (fc) fc.style.display = 'block';
    }, td + 200);
  }, 1600);
}

function closeFullscreen() {
  g('fsOverlay').classList.remove('open');
  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
}
