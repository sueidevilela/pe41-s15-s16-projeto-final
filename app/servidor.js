/*
 * CUIDAR — servidor local do Tradutor da Saúde.
 *
 * O que ele faz:
 *   1. abre o protótipo (cuidar_v6.html, com a Central de Ajuda) em http://localhost:3000
 *      e as imagens da Central (img/ajuda/*.png). A v5 continua em /cuidar_v5.html;
 *   2. recebe a pergunta da tela do Tradutor em POST /api/tradutor;
 *   3. busca os verbetes certos em dados/biblioteca.json (app/rag.js);
 *   4. chama a IA (Claude) só com esses verbetes e devolve a resposta em 3 blocos + fontes;
 *   5. registra cada uso em logs/tradutor.jsonl SEM o texto digitado (só tamanho, status e verbetes).
 *
 * A chave da API fica no arquivo .env (que NÃO vai para o GitHub) e nunca chega ao navegador.
 *
 * Como usar:
 *   npm install
 *   copie .env.example para .env (a chave da IA é opcional: vazia = custo zero)
 *   npm start
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod');
const { buscar, montarMensagens } = require('./rag.js');

const RAIZ = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(RAIZ, '.env')); } catch { /* sem .env: o Tradutor avisa na tela */ }
// O texto de exemplo antigo ("cole-sua-chave") não é uma chave: trata como "sem chave" (modo biblioteca).
if (/cole-sua-chave/i.test(process.env.ANTHROPIC_API_KEY || '')) delete process.env.ANTHROPIC_API_KEY;

const PORTA = Number(process.env.PORT) || 3000;
const MODELO = 'claude-opus-5-5';
const MAX_CARACTERES = 3000;
const base = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados', 'biblioteca.json'), 'utf8'));
const AVISO = `${base.aviso} Em emergência, ligue para o SAMU (192).`;
const LOG = path.join(RAIZ, 'logs', 'tradutor.jsonl');

// Mesmos padrões de dado pessoal da tela (CPF, cartão do SUS, telefone, e-mail).
const DADO_PESSOAL = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\bcpf\b|cart[aã]o (do )?sus|\bcns\b|[\w.+-]+@[\w-]+\.[\w.]+|\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/i;

// Formato da resposta: os 3 blocos da tela + quais trechos foram usados.
const Resposta = z.object({
  diz: z.array(z.string()),
  nao_da_para_concluir: z.array(z.string()),
  perguntas: z.array(z.string()),
  trechos_usados: z.array(z.number().int()),
});

// Só estes arquivos podem ser abertos pelo navegador.
const ARQUIVOS = {
  '/': ['cuidar_v6.html', 'text/html; charset=utf-8'],
  '/cuidar_v6.html': ['cuidar_v6.html', 'text/html; charset=utf-8'],
  '/cuidar_v5.html': ['cuidar_v5.html', 'text/html; charset=utf-8'],
  '/js/config.js': ['js/config.js', 'text/javascript; charset=utf-8'],
  '/login.html': ['login.html', 'text/html; charset=utf-8'],
  '/js/supabase-cliente.js': ['js/supabase-cliente.js', 'text/javascript; charset=utf-8'],
  '/js/protecao.js': ['js/protecao.js', 'text/javascript; charset=utf-8'],
  '/js/login.js': ['js/login.js', 'text/javascript; charset=utf-8'],
  '/js/tradutor-biblioteca.js': ['js/tradutor-biblioteca.js', 'text/javascript; charset=utf-8'],
  '/app/rag.js': ['app/rag.js', 'text/javascript; charset=utf-8'],
  '/dados/biblioteca.json': ['dados/biblioteca.json', 'application/json; charset=utf-8'],
};

// Imagens da Central de Ajuda: só arquivos .png com nome simples dentro de img/ajuda/
// (letras minúsculas, números e hífen). Assim ninguém consegue pedir outros arquivos.
const IMAGEM_AJUDA = /^\/img\/ajuda\/[a-z0-9-]+\.png$/;

function registrar(entrada) {
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify({ data: new Date().toISOString(), ...entrada }) + '\n', 'utf8');
  } catch (e) { console.error('Não consegui gravar o log:', e.message); }
}

function fonteDe(v) {
  return `${v.tema} — ${v.fonte}${v.link ? ` (${v.link})` : ''}`;
}

async function traduzir(texto) {
  if (!texto) return { status: 'erro', mensagem: 'Cole um termo ou trecho para explicar.' };
  if (texto.length > MAX_CARACTERES) return { status: 'erro', mensagem: `O texto passou de ${MAX_CARACTERES} caracteres. Cole um trecho menor.` };
  if (DADO_PESSOAL.test(texto)) return { status: 'dado_pessoal', mensagem: 'O texto parece ter um dado pessoal (CPF, cartão do SUS, telefone ou e-mail). Apague e tente de novo. Nada foi enviado.' };

  const achados = buscar(texto, base.verbetes);
  if (!achados.length) {
    // Sem verbete: não chama a IA, para ela não responder com conhecimento de fora da biblioteca.
    const r = {
      status: 'sem_verbete',
      mensagem: 'Esse tema ainda não está na biblioteca do CUIDAR. Leve essa dúvida à equipe de saúde que acompanha você.',
      perguntas: ['Vocês podem me explicar este trecho em palavras simples?'],
      aviso: AVISO,
    };
    registrar({ tamanho: texto.length, verbetes: [], status: r.status });
    return r;
  }

  if (!process.env.ANTHROPIC_API_KEY) return modoBiblioteca(texto, achados);

  try {
    return await modoIA(texto, achados);
  } catch (e) {
    // Sem crédito, sem internet ou IA fora do ar: o Tradutor continua respondendo com a biblioteca.
    console.error('IA indisponível, usando o modo biblioteca:', mensagemDeErro(e));
    return modoBiblioteca(texto, achados, mensagemDeErro(e));
  }
}

/* MODO BIBLIOTECA (sem IA): mostra o verbete revisado mais próximo da pergunta, exatamente como está na
   biblioteca, com fonte e perguntas para a equipe. Nenhum texto é gerado. */
function modoBiblioteca(texto, achados, motivo) {
  const principal = achados[0].verbete;
  // "Veja também" só com temas da mesma fonte do verbete principal (evita sugestão sem relação, que pode assustar).
  const outros = achados.slice(1).map(a => a.verbete).filter(v => v.fonte === principal.fonte);
  const frases = principal.explicacao.split(/(?<=[.!?:])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).filter(Boolean);
  const r = {
    status: 'ok',
    modo: 'biblioteca',
    tema: principal.tema,
    diz: frases,
    nao: [
      'Esta é uma explicação geral da biblioteca do CUIDAR, não do seu caso.',
      'O que isso significa para você só a equipe de saúde que acompanha você pode dizer.',
    ],
    perguntas: principal.o_que_perguntar || [],
    relacionados: outros.map(v => v.tema),
    fontes: [fonteDe(principal)],
    verbetes: achados.map(a => a.verbete.id),
    aviso: AVISO,
    ...(motivo ? { motivo } : {}),
  };
  registrar({ tamanho: texto.length, verbetes: r.verbetes, status: 'ok', modo: 'biblioteca', ...(motivo ? { motivo } : {}) });
  return r;
}

/* MODO IA: a IA recebe só os verbetes encontrados e explica a pergunta em linguagem simples. */
async function modoIA(texto, achados) {
  const msg = montarMensagens(texto, achados, base.aviso);
  const client = new Anthropic();
  const resp = await client.beta.messages.create({
    model: MODELO,
    max_tokens: 16000,
    // Se um filtro de segurança recusar por engano, a Anthropic tenta de novo em outro modelo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: msg.system,
    output_config: { effort: 'low', format: zodOutputFormat(Resposta) },
    messages: [{ role: 'user', content: msg.user }],
  });

  if (resp.stop_reason === 'refusal') {
    registrar({ tamanho: texto.length, verbetes: msg.fontes_usadas, status: 'recusa' });
    return { status: 'erro', mensagem: 'Não foi possível explicar este trecho. Leve a dúvida à equipe de saúde.' };
  }
  const bruto = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const dados = Resposta.parse(JSON.parse(bruto));

  const usados = dados.trechos_usados.map(n => achados[n - 1]).filter(Boolean);
  const fontes = [...new Set((usados.length ? usados : achados).map(a => fonteDe(a.verbete)))];
  const r = {
    status: 'ok',
    modo: 'ia',
    diz: dados.diz,
    nao: dados.nao_da_para_concluir,
    perguntas: dados.perguntas,
    fontes,
    verbetes: achados.map(a => a.verbete.id),
    aviso: AVISO,
  };
  registrar({ tamanho: texto.length, verbetes: r.verbetes, status: 'ok', modo: 'ia', modelo: resp.model });
  return r;
}

function mensagemDeErro(e) {
  if (e instanceof Anthropic.AuthenticationError) return 'A chave da API não foi aceita. Confira o arquivo .env.';
  if (e instanceof Anthropic.RateLimitError) return 'Muitas perguntas seguidas. Espere um pouco e tente de novo.';
  if (e instanceof Anthropic.APIConnectionError) return 'Sem conexão com a IA agora. Confira a internet e tente de novo.';
  if (e instanceof Anthropic.APIError) return `A IA não respondeu (erro ${e.status}). Tente de novo em instantes.`;
  return 'Não foi possível montar a explicação. Tente de novo em instantes.';
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/tradutor') {
    let corpo = '';
    req.on('data', c => { corpo += c; if (corpo.length > 20000) req.destroy(); });
    req.on('end', async () => {
      let r;
      try {
        const { texto } = JSON.parse(corpo || '{}');
        r = await traduzir(String(texto || '').trim());
      } catch (e) {
        console.error('Erro no Tradutor:', e);
        r = { status: 'erro', mensagem: mensagemDeErro(e) };
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(r));
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ verbetes: base.verbetes.length, modo: process.env.ANTHROPIC_API_KEY ? 'ia' : 'biblioteca', modelo: MODELO }));
    return;
  }

  const arq = req.method === 'GET' && ARQUIVOS[url.pathname];
  if (arq) {
    res.writeHead(200, { 'Content-Type': arq[1] });
    fs.createReadStream(path.join(RAIZ, arq[0])).pipe(res);
    return;
  }
  if (req.method === 'GET' && IMAGEM_AJUDA.test(url.pathname)) {
    const arquivo = path.join(RAIZ, url.pathname);
    if (fs.existsSync(arquivo)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(arquivo).pipe(res);
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Não encontrado');
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`CUIDAR rodando em http://localhost:${PORTA}`);
  console.log(`Biblioteca: ${base.verbetes.length} verbetes · ${process.env.ANTHROPIC_API_KEY ? `modo IA (${MODELO})` : 'modo biblioteca, sem IA (para ligar a IA, crie o .env: veja .env.example)'}`);
});
