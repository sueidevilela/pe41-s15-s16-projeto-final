// =====================================================================
// CAPTURA DOS PRINTS DA CENTRAL DE AJUDA
// =====================================================================
// Tira as 13 fotos de tela do CUIDAR (tamanho celular) usando o Chrome
// sem janela, já com os destaques (contorno coral + números), e salva
// com os nomes do kit-ajuda/04-roteiro-prints.md.
//
// COMO USAR (no terminal, dentro da pasta kit-biblioteca-cuidar/):
//   node ferramentas/capturar-prints.mjs
//
// Use de novo sempre que alguma tela do app mudar.
// Para fotos SEM destaque, troque COM_DESTAQUE para false.
// =====================================================================
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const COM_DESTAQUE = true;

// Cores dos destaques
const COR_CONTORNO = '#d9604e';               // coral (mesma família da bolinha de aviso do app)
const COR_BRILHO   = 'rgba(217, 96, 78, .22)'; // brilho suave em volta do contorno
const COR_VEU      = 'rgba(255, 255, 255, .55)'; // "holofote": clareia o resto da imagem
const COR_NUMERO   = '#173d62';               // azul-marinho dos títulos do app (--navy)

// Pastas e programas
const PASTA_PROJETO = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(PASTA_PROJETO, 'cuidar_v6.html');
const SAIDA = join(PASTA_PROJETO, 'img', COM_DESTAQUE ? 'ajuda' : 'ajuda-cruas');
const PERFIL = join(tmpdir(), 'cuidar-v6-captura-perfil');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(existsSync);
if (!CHROME) { console.error('Não achei o Chrome nem o Edge.'); process.exit(1); }
mkdirSync(SAIDA, { recursive: true });

const CELULAR = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const COMPUTADOR = { width: 1100, height: 760, deviceScaleFactor: 2, mobile: false };

// Cada foto:
//   prep      = o que fazer no app antes da foto
//   recorte   = quais partes da tela aparecem na foto
//   destaque  = o que ganha contorno coral (com 1 só destaque, o resto fica clareado)
//   numeros   = campos que ganham os números 1, 2, 3...
const capturas = [
  { nome: 'ajuda-01-visao-geral', tela: CELULAR, prep: "showPage('inicio')",
    recorte: "[q('.topbar'), q('.welcome')]", destaque: "[q('.welcome h2')]" },
  { nome: 'ajuda-02-menu', tela: COMPUTADOR, prep: "showPage('inicio')",
    recorte: "[q('.brand'), ...qa('.sidebar .nav')]", destaque: "[q('.nav-btn[data-page=documentos]')]" },
  { nome: 'ajuda-03-menu-celular', tela: CELULAR, prep: "showPage('inicio')",
    recorte: "[q('.topbar')]", extraAbaixo: 40, destaque: "[q('#menuBtn')]" },
  { nome: 'ajuda-04-formulario-documento', tela: CELULAR, prep: "showPage('documentos')",
    recorte: "[q('#docForm .field'), q('#docForm .actions')]",
    numeros: "[q('#docForm .field'), q('#docOrigin').closest('.field'), q('#docType').closest('.field'), q('#docForm .actions .btn-primary')]",
    destaque: "[q('#docForm .actions .btn-primary')]" },
  { nome: 'ajuda-05-arquivos-registrados', tela: CELULAR, prep: "showPage('documentos')",
    recorte: "[q('#docForm .section-head'), ...[...qa('#docList .doc-row')].slice(0, 3)]",
    destaque: "[q('#docList .doc-row .btn-link')]" },
  { nome: 'ajuda-06-proximo-compromisso', tela: CELULAR, prep: "showPage('inicio')",
    recorte: "[q('.card.appt')]", destaque: "[q('.card.appt')]" },
  { nome: 'ajuda-07-historico', tela: CELULAR, prep: "showPage('historico')",
    recorte: "[q('#historico .hero'), q('#historico .timeline')]", destaque: "[]" },
  { nome: 'ajuda-08-depois-consulta', tela: CELULAR, prep: "showPage('consulta')",
    recorte: "[q('#consultNotes').closest('.field'), q('#notesBtn')]",
    numeros: "[q('#consultNotes').closest('.field'), q('#consultOrient').closest('.field')]", destaque: "[q('#notesBtn')]" },
  { nome: 'ajuda-09-tradutor', tela: CELULAR,
    prep: "showPage('tradutor'); q('#medicalText').value = 'esteatose hepática'",
    recorte: "[q('#medicalText').closest('.field'), q('#explainBtn')]", destaque: "[q('#explainBtn')]" },
  { nome: 'ajuda-10-equipe-especialidades', tela: CELULAR, prep: "showPage('equipe')",
    recorte: "[q('#teamGrid')]", destaque: "[]" },
  { nome: 'ajuda-11-formulario-contato', tela: CELULAR, prep: "showPage('equipe')",
    recorte: "[q('#contactForm .card-title'), q('#contactBtn')]",
    numeros: "[q('#contactForm .topics').closest('.field'), q('#contactMessage').closest('.field')]", destaque: "[q('#contactBtn')]" },
  { nome: 'ajuda-12-paliativo-conversa', tela: CELULAR, prep: "showPage('paliativos')",
    recorte: "[q('#palQ'), q('#palBtn')]",
    numeros: "[q('#palChips')]", destaque: "[q('#palBtn')]" },
  { nome: 'ajuda-13-botao-letra', tela: CELULAR, prep: "showPage('ajuda')",
    recorte: "[q('.ajuda-ferramentas'), q('.ajuda-busca')]", destaque: "[q('#ajuda-letra-mais')]" }
];

// Código que roda DENTRO da página para desenhar os destaques.
const DESENHAR = `(destaques, numeros, cores) => {
  const caixa = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const raio = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10;
  const novo = (css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;pointer-events:none;z-index:9999;box-sizing:border-box;' + css; document.body.appendChild(d); return d; };
  // Os contornos são desenhados DEPOIS dos números (que mudam um pouco o lugar das coisas).
  const desenharContornos = () => destaques.forEach((el) => {
    const b = caixa(el), folga = 6;
    // "Holofote" só quando há UM destaque e nenhum número (senão apagaria os campos numerados).
    const veu = destaques.length === 1 && !numeros.length ? ', 0 0 0 4000px ' + cores.veu : '';
    novo('left:' + (b.x - folga) + 'px;top:' + (b.y - folga) + 'px;width:' + (b.w + 2 * folga) + 'px;height:' + (b.h + 2 * folga) + 'px;' +
      'border:3px solid ' + cores.contorno + ';border-radius:' + (raio(el) + folga) + 'px;' +
      'box-shadow:0 0 0 5px ' + cores.brilho + veu);
  });
  // Números: entram ANTES do título do campo (sem cobrir texto nenhum).
  numeros.forEach((el, i) => {
    const n = document.createElement('span');
    n.textContent = String(i + 1);
    n.style.cssText = 'display:inline-grid;place-items:center;width:28px;height:28px;margin-right:8px;vertical-align:middle;' +
      'border-radius:50%;background:' + cores.numero + ';color:#fff;font:800 15px/1 Inter,system-ui,sans-serif;flex:none';
    const rotulo = el.querySelector && el.querySelector('label, .label, legend');
    if (rotulo) { rotulo.style.display = 'flex'; rotulo.style.alignItems = 'center'; rotulo.prepend(n); }
    else if (el.classList.contains('field')) { n.style.marginBottom = '2px'; el.prepend(n); }
    else { el.before(n); }
  });
  desenharContornos();
}`;

// ---------- Conversa com o Chrome (protocolo DevTools) ----------
const PORTA = 9333;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${PERFIL}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let alvo;
for (let i = 0; i < 50 && !alvo; i++) {
  try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json()).find(t => t.type === 'page'); }
  catch { await espera(200); }
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pendentes = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id); }
});
const cdp = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq; pendentes.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id, method, params }));
});
const avaliar = async expr => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro JS');
  return r.result.value;
};

// ---------- Tira as fotos ----------
await cdp('Page.enable');
await cdp('Runtime.enable');
// Pede ao app "menos movimento": as telas aparecem paradas, sem animação de entrada.
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
const AJUDANTES = "const q = s => document.querySelector(s), qa = s => document.querySelectorAll(s);";
for (const c of capturas) {
  await cdp('Emulation.setDeviceMetricsOverride', c.tela);
  await cdp('Page.navigate', { url: pathToFileURL(HTML).href });
  await espera(900);
  await avaliar("document.documentElement.style.scrollBehavior='auto'; try{localStorage.clear()}catch(e){}; 0");
  await avaliar(AJUDANTES + " try { q('#tour').close(); } catch (e) {} setTheme('light', true); setScale(1, true); " +
    // esconde a barra de baixo do celular e os avisos, que ficariam por cima do conteúdo na foto
    "q('.bottom-nav').style.display = 'none'; q('#toasts').style.display = 'none'; " + c.prep + '; 0');
  await espera(400);
  if (COM_DESTAQUE) {
    await avaliar(`(() => { ${AJUDANTES}
      (${DESENHAR})((${c.destaque || '[]'}).filter(Boolean), (${c.numeros || '[]'}).filter(Boolean),
        { contorno: '${COR_CONTORNO}', brilho: '${COR_BRILHO}', veu: '${COR_VEU}', numero: '${COR_NUMERO}' });
      return 0; })()`);
  }
  const r = await avaliar(`(() => { ${AJUDANTES}
    const els = (${c.recorte}).filter(Boolean);
    if (!els.length) return null;
    const rs = els.map(e => e.getBoundingClientRect());
    const m = 22;
    const x = Math.max(0, Math.min(...rs.map(k => k.left)) + scrollX - m);
    const y = Math.max(0, Math.min(...rs.map(k => k.top)) + scrollY - m);
    const x2 = Math.min(document.documentElement.clientWidth, Math.max(...rs.map(k => k.right)) + scrollX + m);
    const y2 = Math.max(...rs.map(k => k.bottom)) + scrollY + m + ${c.extraAbaixo || 0};
    return { x, y, width: x2 - x, height: y2 - y };
  })()`);
  if (!r) { console.log('FALHOU (parte da tela não encontrada):', c.nome); continue; }
  const foto = await cdp('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 }, captureBeyondViewport: true });
  writeFileSync(join(SAIDA, c.nome + '.png'), Buffer.from(foto.data, 'base64'));
  console.log('ok', c.nome);
}
ws.close();
chrome.kill();
console.log('Fotos salvas em', SAIDA);
process.exit(0);
