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
  f.style.animation = 'none';
  void f.offsetHeight;
  f.classList.add('scanning');
  if (cb) setTimeout(cb, 380);
  setTimeout(() => { f.classList.remove('scanning'); f.style.animation = ''; }, 750);
}

function mF(sfx, n, iv, cb) {
  flash(sfx, cb);
}

function aIn(id, d) {
  setTimeout(() => { const el = g(id); if (el) el.classList.add('in'); }, d);
}

function rAll(sfx) {
  [
    'epBadge', 'anlTag', 'galanTag', 'teamWrap', 'metaBadges',
    'actSaidas', 'saidasPhotoWrap', 'saidasTitle', 'saidasCard',
    'actChegadas', 'chegadasPhotoWrap', 'chegadasTitle', 'chegadasCard',
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

  g('saidasText'   + sfx).textContent = g('fSaidas').value   || '—';
  g('chegadasText' + sfx).textContent = g('fChegadas').value || '—';
}

function runAnim(sfx) {
  const TD = 22000;
  sP(sfx, TD);
  flash(sfx);

  // Tela 1 — Time Original
  aIn('epBadge'    + sfx, 100);
  aIn('anlTag'     + sfx, 200);
  aIn('galanTag'   + sfx, 200);
  aIn('teamWrap'   + sfx, 650);
  aIn('metaBadges' + sfx, 2200);

  // Tela 2 — Saídas (5s)
  setTimeout(() => {
    mF(sfx, 2, 110, () => {
      aIn('actSaidas'       + sfx, 0);
      aIn('saidasPhotoWrap' + sfx, 400);
      aIn('saidasTitle'     + sfx, 950);
      aIn('saidasCard'      + sfx, 1350);
    });
  }, 5000);

  // Tela 3 — Chegadas (11s)
  setTimeout(() => {
    mF(sfx, 2, 110, () => {
      aIn('actChegadas'      + sfx, 0);
      aIn('chegadasPhotoWrap'+ sfx, 400);
      aIn('chegadasTitle'    + sfx, 950);
      aIn('chegadasCard'     + sfx, 1350);
    });
  }, 11000);

  // Tela 4 — CTA (17s)
  setTimeout(() => {
    mF(sfx, 3, 110, () => {
      aIn('actCta'    + sfx, 0);
      aIn('cTL' + sfx, 200);
      aIn('cTR' + sfx, 260);
      aIn('cBL' + sfx, 320);
      aIn('cBR' + sfx, 380);
    });
  }, 17000);
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
  setTimeout(() => intro.classList.add('in'),    50);
  setTimeout(() => intro.classList.remove('in'), 2000);
  setTimeout(() => runAnim('FS'),                2500);

  _fsCloseTimer = setTimeout(() => { g('fsClose').style.display = 'block'; }, 25200);
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
