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
    if (ns || nc || imgs.alts[i].saida || imgs.alts[i].chegada) {
      result.push({ saidaName: ns, chegadaName: nc, saidaImg: imgs.alts[i].saida, chegadaImg: imgs.alts[i].chegada });
    }
  }
  return result;
}

function setAltContent(sfx, alt) {
  const imgS = g('altImgSaida'    + sfx); if (imgS) imgS.src = alt.saidaImg   || '';
  const imgC = g('altImgChegada'  + sfx); if (imgC) imgC.src = alt.chegadaImg || '';
  const nS   = g('altNameSaida'   + sfx); if (nS)   nS.textContent = alt.saidaName;
  const nC   = g('altNameChegada' + sfx); if (nC)   nC.textContent = alt.chegadaName;
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

function flashEl(el, cb) {
  if (!el) { if (cb) setTimeout(cb, 380); return; }
  el.classList.remove('scanning');
  void el.offsetHeight;
  el.classList.add('scanning');
  if (cb) setTimeout(cb, 380);
  setTimeout(() => el.classList.remove('scanning'), 750);
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

function prepAlt(sfx) {
  const el = g('actAlt' + sfx);
  if (!el) return;
  el.querySelectorAll('.alt-top, .alt-bottom').forEach((half, i) => {
    half.style.transition = 'none';
    half.style.transform = i === 0 ? 'translateY(-100%)' : 'translateY(100%)';
  });
  void el.offsetHeight;
  el.querySelectorAll('.alt-top, .alt-bottom').forEach(half => {
    half.style.transition = '';
    half.style.transform = '';
  });
}

function rAll(sfx) {
  clearAnimTimers();
  const img = g('teamImgOrig' + sfx);
  if (img && imgs.orig) img.src = imgs.orig;

  const ids = ['anlTag', 'teamWrap', 'actAlt', 'actFinal', 'actCta', 'cTL', 'cTR', 'cBL', 'cBR'];

  // Snap: disable transitions before removing classes so there's no fade flicker on reset
  ids.forEach(id => { const el = g(id + sfx); if (el) el.style.transition = 'none'; });

  const altEl = g('actAlt' + sfx);
  if (altEl) {
    altEl.querySelectorAll('.alt-top, .alt-bottom').forEach((half, i) => {
      half.style.transition = 'none';
      half.style.transform = i === 0 ? 'translateY(-100%)' : 'translateY(100%)';
    });
  }

  ids.forEach(id => {
    const el = g(id + sfx);
    if (!el) return;
    el.classList.remove('in');
    el.classList.remove('label-phase');
  });

  void document.body.offsetHeight; // force reflow so snap applies

  ids.forEach(id => { const el = g(id + sfx); if (el) el.style.transition = ''; });
  if (altEl) { altEl.querySelectorAll('.alt-top, .alt-bottom').forEach(half => { half.style.transition = ''; }); }
}

function prepData(sfx) {
  const imgOrig = g('teamImgOrig' + sfx);
  if (imgOrig && imgs.orig) imgOrig.src = imgs.orig;
  const imgFinal = g('finalTeamImg' + sfx);
  if (imgFinal && imgs.final) imgFinal.src = imgs.final;
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

// skipFirst=true: openFullscreen já entrou na fase de label via flashTopFS,
// runAnim só gerencia os timers a partir do conteúdo da 1ª alt.
function runAnim(sfx, skipFirst) {
  const alts = getAlts();

  const FLASH_CB  = 380;
  const LABEL_DUR = 1200;
  const ALT_DUR   = 3500;
  const FINAL_DUR = 3000;
  const CTA_DUR   = 5000;
  const T_ALT_FLASH = 100;

  // skipFirst: label já foi mostrada em t=0 (pelo flashTopFS), conteúdo aparece após LABEL_DUR.
  // !skipFirst (preview): flash dispara em T_ALT_FLASH, label entra no callback, conteúdo após +LABEL_DUR.
  const T_CONTENT = skipFirst
    ? LABEL_DUR
    : T_ALT_FLASH + FLASH_CB + LABEL_DUR;

  const T_FINAL_FLASH = alts.length > 0
    ? T_CONTENT + alts.length * ALT_DUR
    : (skipFirst ? 500 : T_ALT_FLASH + 300);

  const T_CTA_FLASH = T_FINAL_FLASH + FLASH_CB + FINAL_DUR;
  const TD          = T_CTA_FLASH   + FLASH_CB + CTA_DUR;

  sP(sfx, TD);

  if (alts.length > 0) {
    if (!skipFirst) {
      // Preview: flash → fase de label entra
      _animTimers.push(setTimeout(() => {
        prepAlt(sfx);
        flash(sfx, () => {
          const el = g('actAlt' + sfx);
          if (el) { el.classList.add('label-phase'); el.classList.add('in'); }
        });
      }, T_ALT_FLASH));
    }

    // Label → conteúdo da 1ª alt (sem flash — tela já está aberta)
    _animTimers.push(setTimeout(() => {
      setAltContent(sfx, alts[0]);
      const el = g('actAlt' + sfx);
      if (el) el.classList.remove('label-phase');
    }, T_CONTENT));

    // Alterações seguintes: flash → snap + reanima as metades
    alts.forEach((alt, i) => {
      if (i === 0) return;
      _animTimers.push(setTimeout(() => {
        flash(sfx, () => {
          setAltContent(sfx, alt);
          prepAlt(sfx);
        });
      }, T_CONTENT + i * ALT_DUR));
    });
  }

  // Flash → actAlt sai e actFinal entra (no mesmo callback)
  _animTimers.push(setTimeout(() => {
    flash(sfx, () => {
      const elA = g('actAlt'   + sfx); if (elA) elA.classList.remove('in');
      const elF = g('actFinal' + sfx); if (elF) elF.classList.add('in');
    });
  }, T_FINAL_FLASH));

  // Flash → actFinal sai e actCta entra
  _animTimers.push(setTimeout(() => {
    flash(sfx, () => {
      const elF = g('actFinal' + sfx); if (elF) elF.classList.remove('in');
      aIn('actCta' + sfx, 0);
      aIn('cTL'    + sfx, 200);
      aIn('cTR'    + sfx, 260);
      aIn('cBL'    + sfx, 320);
      aIn('cBR'    + sfx, 380);
    });
  }, T_CTA_FLASH));

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

  // flashTopFS (z-index 250, acima da intro) serve como o único flash da transição intro→alt.
  // No callback: remove a intro E entra na fase de label — sem disparar outro flash na cena.
  setTimeout(() => {
    flashEl(g('flashTopFS'), () => {
      if (intro)   intro.classList.remove('in');
      if (epBadge) epBadge.classList.remove('in');
      if (sticker) sticker.classList.remove('in');
      if (cBadge)  cBadge.classList.remove('in');
      if (fBadge)  fBadge.classList.remove('in');

      // Entra na fase de label direto (flashTopFS já foi o flash de transição)
      const alts = getAlts();
      if (alts.length > 0) {
        prepAlt('FS');
        const el = g('actAltFS');
        if (el) { el.classList.add('label-phase'); el.classList.add('in'); }
      }

      // runAnim começa já sabendo que a fase de label foi iniciada (skipFirst=true)
      const td = runAnim('FS', true);
      _fsCloseTimer = setTimeout(() => {
        const fc = g('fsClose');
        if (fc) fc.style.display = 'block';
      }, td + 200);
    });
  }, 1200);
}

function closeFullscreen() {
  g('fsOverlay').classList.remove('open');
  if (_fsCloseTimer) clearTimeout(_fsCloseTimer);
}
