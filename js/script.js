/* ===========================================================
   Análise de Times — gerador de carrossel (TikTok foto)
   Cada slide é uma imagem estática 1080×1920 (9:16).
   =========================================================== */

const imgs = {
  orig: null,
  final: null,
  alts: Array.from({ length: 5 }, () => ({ saida: null, chegada: null }))
};

const FORRAGEM_CLASS = { muito: 'forr-muito', mediano: 'forr-mediano', pouco: 'forr-pouco' };
const FORRAGEM_LABEL = { muito: 'Muito', mediano: 'Mediano', pouco: 'Pouco' };

function g(id) { return document.getElementById(id); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ===== UPLOAD DE IMAGENS =====
   Redimensiona a foto no momento do upload e re-codifica em PNG.
   Fotos de celular vêm com 4000px+ e dataURL gigantes que o iOS Safari
   trata mal no html-to-image (o slide sai sem a foto). Aqui a gente
   normaliza para uma largura segura. */

function loadAndResize(file, maxW) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = ev => {
      const im = new Image();
      im.onload = () => {
        const sw = im.naturalWidth || 1, sh = im.naturalHeight || 1;
        const scale = sw > maxW ? maxW / sw : 1;
        const w = Math.max(1, Math.round(sw * scale));
        const h = Math.max(1, Math.round(sh * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(im, 0, 0, w, h);
        resolve(cv.toDataURL('image/png'));
      };
      im.onerror = () => reject(new Error('falha ao decodificar imagem'));
      im.src = ev.target.result;
    };
    r.onerror = () => reject(new Error('falha ao ler arquivo'));
    r.readAsDataURL(file);
  });
}

async function onFile(e, type, altIdx, side) {
  const f = e.target.files[0];
  if (!f) return;
  const maxW = type === 'alt' ? 800 : 1400;
  let data;
  try {
    data = await loadAndResize(f, maxW);
  } catch (err) {
    console.warn('onFile:', err);
    return;
  }
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
  buildCarousel();
}

function showPrev(prevId, nameId, src, name) {
  const prev = g(prevId);
  if (prev) { prev.src = src; prev.style.display = 'block'; }
  if (nameId) {
    const nameEl = g(nameId);
    if (nameEl && name) { nameEl.textContent = name; nameEl.style.display = 'block'; }
  }
}

/* ===== COLETA DOS DADOS DO FORMULÁRIO ===== */

function val(id) { const e = g(id); return e ? (e.value || '').trim() : ''; }

function collectData() {
  const alts = [];
  for (let i = 0; i < 5; i++) {
    const sn = val('altSaidaName' + (i + 1));
    const cn = val('altChegadaName' + (i + 1));
    const as = val('altAnaliseSaida' + (i + 1));
    const ac = val('altAnaliseChegada' + (i + 1));
    const si = imgs.alts[i].saida;
    const ci = imgs.alts[i].chegada;
    if (sn || cn || as || ac || si || ci) {
      alts.push({
        saidaName: sn, chegadaName: cn,
        analiseSaida: as, analiseChegada: ac,
        saidaImg: si, chegadaImg: ci
      });
    }
  }
  const forrKey = (g('fForragem') && g('fForragem').value) || 'mediano';
  return {
    ep: val('fEp') || '1',
    tema: val('fTema'),
    coins: val('fCoins'),
    forrKey: forrKey,
    orig: imgs.orig,
    final: imgs.final,
    alts: alts
  };
}

function epPad(ep) { return String(parseInt(ep, 10) || 1).padStart(2, '0'); }

/* ===== FUNDO SVG (um por slide, ids únicos) ===== */

function slideBg(uid) {
  return `<svg class="bg-svg" viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <radialGradient id="bgA${uid}" cx="85%" cy="10%" r="55%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.45"/><stop offset="100%" stop-color="#08050f" stop-opacity="0"/></radialGradient>
      <radialGradient id="bgB${uid}" cx="15%" cy="85%" r="50%"><stop offset="0%" stop-color="#d946ef" stop-opacity="0.22"/><stop offset="100%" stop-color="#08050f" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="360" height="640" fill="#08050f"/>
    <rect width="360" height="640" fill="url(#bgA${uid})"/>
    <rect width="360" height="640" fill="url(#bgB${uid})"/>
    <line x1="-60" y1="0" x2="280" y2="640" stroke="#d946ef" stroke-width="0.5" stroke-opacity="0.05"/>
    <line x1="40" y1="0" x2="380" y2="640" stroke="#d946ef" stroke-width="0.5" stroke-opacity="0.05"/>
    <line x1="140" y1="0" x2="480" y2="640" stroke="#d946ef" stroke-width="0.5" stroke-opacity="0.05"/>
    <line x1="240" y1="0" x2="580" y2="640" stroke="#8b5cf6" stroke-width="0.5" stroke-opacity="0.05"/>
    <polygon points="360,0 360,100 260,0" fill="#8b5cf6" opacity="0.07"/>
    <polygon points="0,640 100,640 0,540" fill="#d946ef" opacity="0.06"/>
  </svg>`;
}

/* ===== CONSTRUÇÃO DOS SLIDES ===== */

function capaSlide(d, uid) {
  const photo = d.orig
    ? `<img class="capa-team" src="${d.orig}" alt="">`
    : `<div class="capa-team ph">Foto do time</div>`;
  const sticker = d.tema
    ? `<div class="sticker"><span>${esc(d.tema)}</span></div>`
    : '';
  return el(`<div class="slide slide-capa">
    ${slideBg(uid)}
    <div class="capa-body">
      <div class="capa-brand">
        <span class="cb-main">ANÁLISE DE TIMES</span>
        <span class="cb-sub">Galandinho</span>
      </div>
      <div class="capa-head">
        <div class="ep-badge"><span class="ep-l">EP</span><span class="ep-n">${epPad(d.ep)}</span></div>
        ${sticker}
      </div>
      ${photo}
      <div class="capa-meta">
        <div class="badge">💰 ${esc(d.coins || '—')}</div>
        <div class="badge ${FORRAGEM_CLASS[d.forrKey]}">Forragem: ${FORRAGEM_LABEL[d.forrKey]}</div>
      </div>
      <div class="swipe-hint">Arraste para ver a análise <span>→</span></div>
    </div>
  </div>`);
}

function altSlide(d, alt, uid) {
  const outPhoto = alt.saidaImg
    ? `<img class="alt-photo out" src="${alt.saidaImg}" alt="">`
    : `<div class="alt-photo ph out">${esc(alt.saidaName || 'Sem foto')}</div>`;
  const inPhoto = alt.chegadaImg
    ? `<img class="alt-photo in" src="${alt.chegadaImg}" alt="">`
    : `<div class="alt-photo ph in">${esc(alt.chegadaName || 'Sem foto')}</div>`;
  const outText = alt.analiseSaida
    ? `<div class="alt-text">${esc(alt.analiseSaida)}</div>` : '';
  const inText = alt.analiseChegada
    ? `<div class="alt-text">${esc(alt.analiseChegada)}</div>` : '';
  return el(`<div class="slide slide-alt">
    ${slideBg(uid)}
    <div class="alt-body">
      <div class="alt-side out">${outPhoto}${outText}</div>
      <div class="alt-divider"></div>
      <div class="alt-side in">${inPhoto}${inText}</div>
    </div>
  </div>`);
}

function finalSlide(d, uid) {
  const photo = d.final
    ? `<img class="final-img" src="${d.final}" alt="">`
    : `<div class="final-img ph">Foto do time final</div>`;
  return el(`<div class="slide slide-final">
    ${slideBg(uid)}
    <div class="final-body">
      <div class="final-label">Time Analisado</div>
      ${photo}
    </div>
  </div>`);
}

function ctaSlide(uid) {
  return el(`<div class="slide slide-cta">
    ${slideBg(uid)}
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
    <div class="cta-body">
      <div class="cta-q">QUER TER SEU TIME ANALISADO?</div>
      <div class="cta-line"></div>
      <div class="cta-free">GRATUITO</div>
      <div class="cta-dm">Só me chamar na DM!</div>
    </div>
  </div>`);
}

/* ===== CARROSSEL ===== */

let currentNodes = [];
let exportCache = { files: null };
let needsRender = true;

function buildCarousel() {
  const d = collectData();
  const nodes = [];
  let uid = 0;
  nodes.push(capaSlide(d, uid++));
  d.alts.forEach(alt => nodes.push(altSlide(d, alt, uid++)));
  nodes.push(finalSlide(d, uid++));
  nodes.push(ctaSlide(uid++));
  currentNodes = nodes;
  needsRender = true; // dados mudaram → precisa renderizar de novo

  const carousel = g('carousel');
  const prevIdx = currentIndex();
  carousel.innerHTML = '';
  nodes.forEach(n => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    item.appendChild(n);
    carousel.appendChild(item);
  });

  buildDots(nodes.length);

  const idx = Math.min(Math.max(prevIdx, 0), nodes.length - 1);
  carousel.scrollLeft = idx * carousel.clientWidth;
  updateActive();
}

function currentIndex() {
  const c = g('carousel');
  if (!c || !c.clientWidth) return 0;
  return Math.round(c.scrollLeft / c.clientWidth);
}

function buildDots(n) {
  const dots = g('dots');
  dots.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('div');
    dot.className = 'cdot';
    dots.appendChild(dot);
  }
}

function updateActive() {
  const total = currentNodes.length;
  const idx = Math.min(currentIndex(), total - 1);
  g('counter').textContent = (idx + 1) + ' / ' + total;
  const dots = g('dots').children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === idx);
  }
}

function goTo(delta) {
  const c = g('carousel');
  const idx = Math.min(Math.max(currentIndex() + delta, 0), currentNodes.length - 1);
  c.scrollTo({ left: idx * c.clientWidth, behavior: 'smooth' });
}

/* ===== EXPORTAÇÃO (DOM → PNG 1080×1920) ===== */

function setHint(msg) { g('hint').innerHTML = msg; }

// Desenha um retângulo arredondado no contexto para uso como clipping path.
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Replica object-fit: contain manualmente desenhando a imagem proporcionalmente
// dentro da caixa (x,y,w,h), centralizada.
function drawImageContain(ctx, im, x, y, w, h) {
  const iw = im.naturalWidth, ih = im.naturalHeight;
  if (!iw || !ih) return;
  const ar = iw / ih, target = w / h;
  let dw, dh;
  if (ar > target) { dw = w; dh = w / ar; }
  else             { dh = h; dw = h * ar; }
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('img load fail'));
    i.src = src;
  });
}

// Renderiza um slide para PNG em duas etapas:
//   1) html-to-image gera o slide (texto, bordas, brilhos, layout).
//      No iOS Safari as fotos podem sair vazias dentro do <foreignObject>;
//      tudo bem — a moldura/brilho permanecem.
//   2) Cada foto é desenhada por cima via Canvas API nativa, medindo a
//      posição/tamanho que ela ocupa no slide e respeitando o border-radius.
//      Esse caminho é estável em qualquer browser.
async function renderNode(node) {
  const stage = g('exportStage');
  stage.innerHTML = '';
  const clone = node.cloneNode(true);
  stage.appendChild(clone);

  const imgEls = Array.prototype.slice.call(clone.querySelectorAll('img'));

  // aguarda as imagens decodificarem antes de medir/renderizar
  await Promise.all(imgEls.map(im => (
    im.complete && im.naturalWidth > 0
      ? Promise.resolve()
      : new Promise(res => { im.onload = im.onerror = res; })
  )));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // mede onde cada foto está dentro do palco 1080×1920
  const stageRect = stage.getBoundingClientRect();
  const imgInfo = imgEls.map(im => {
    const r = im.getBoundingClientRect();
    const cs = getComputedStyle(im);
    return {
      src: im.src,
      x: r.left - stageRect.left,
      y: r.top - stageRect.top,
      w: r.width,
      h: r.height,
      br: parseFloat(cs.borderRadius) || 0
    };
  });

  // 1) gera o slide base (sem garantia de fotos no Safari)
  let baseBlob = null;
  try {
    baseBlob = await htmlToImage.toBlob(clone, {
      width: 1080, height: 1920, pixelRatio: 1, backgroundColor: '#08050f'
    });
  } finally {
    stage.innerHTML = '';
  }
  if (!baseBlob) return null;

  // 2) sobrepõe cada foto por canvas nativo
  const baseUrl = URL.createObjectURL(baseBlob);
  let baseImg;
  try { baseImg = await loadImg(baseUrl); } catch (e) { URL.revokeObjectURL(baseUrl); return null; }

  const out = document.createElement('canvas');
  out.width = 1080; out.height = 1920;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(baseImg, 0, 0, 1080, 1920);
  URL.revokeObjectURL(baseUrl);

  for (const info of imgInfo) {
    if (!info.src || info.w < 1 || info.h < 1) continue;
    let im;
    try { im = await loadImg(info.src); } catch (e) { continue; }
    ctx.save();
    if (info.br > 0) {
      roundRect(ctx, info.x, info.y, info.w, info.h, info.br);
      ctx.clip();
    }
    drawImageContain(ctx, im, info.x, info.y, info.w, info.h);
    ctx.restore();
  }

  return await new Promise(res => out.toBlob(res, 'image/png'));
}

async function renderAll() {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* segue */ }
  }
  const files = [];
  for (let i = 0; i < currentNodes.length; i++) {
    const blob = await renderNode(currentNodes[i]);
    if (blob) {
      const name = 'slide-' + String(i + 1).padStart(2, '0') + '.png';
      files.push(new File([blob], name, { type: 'image/png' }));
    }
  }
  return files;
}

function downloadBlob(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function shareOrDownload(files) {
  if (navigator.canShare && navigator.canShare({ files: files })) {
    try {
      await navigator.share({ files: files, title: 'Análise de Times' });
      setHint('Pronto! Escolha <b>Salvar imagens</b> para mandar tudo pra galeria.');
    } catch (e) {
      if (e && e.name === 'NotAllowedError') {
        setHint('Imagens prontas — toque em <b>Salvar slides</b> mais uma vez.');
      }
      /* se o usuário cancelou, não faz nada */
    }
  } else {
    files.forEach(downloadBlob);
    setHint('Slides baixados. No celular, use o botão de novo para abrir o compartilhamento.');
  }
}

async function onSaveClick() {
  const btn = g('saveBtn');
  if (btn.classList.contains('busy')) return;

  if (typeof htmlToImage === 'undefined') {
    setHint('A biblioteca de imagens não carregou. Verifique a internet e recarregue a página.');
    return;
  }

  if (needsRender || !exportCache.files) {
    buildCarousel(); // garante que os slides refletem o que está no formulário agora
    btn.classList.add('busy');
    btn.textContent = '⏳ Gerando…';
    try {
      exportCache.files = await renderAll();
      needsRender = false;
    } catch (e) {
      setHint('Erro ao gerar as imagens: ' + (e && e.message ? e.message : e));
      return;
    } finally {
      btn.classList.remove('busy');
      btn.textContent = '⤓ Salvar slides';
    }
  }
  await shareOrDownload(exportCache.files);
}

/* ===== INICIALIZAÇÃO ===== */

function debounce(fn, ms) {
  let t;
  return function () { clearTimeout(t); t = setTimeout(fn, ms); };
}

function init() {
  g('genBtn').addEventListener('click', buildCarousel);
  g('saveBtn').addEventListener('click', onSaveClick);
  g('prevBtn').addEventListener('click', () => goTo(-1));
  g('nextBtn').addEventListener('click', () => goTo(1));
  g('carousel').addEventListener('scroll', debounce(updateActive, 60));

  // atualiza o carrossel enquanto o usuário digita (sem precisar sair do campo)
  document.querySelector('.form-grid').addEventListener('input', debounce(buildCarousel, 350));

  window.addEventListener('resize', debounce(() => {
    const c = g('carousel');
    c.scrollLeft = currentIndex() * c.clientWidth;
  }, 150));

  buildCarousel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
