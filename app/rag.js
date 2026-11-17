/*
 * CUIDAR — busca na biblioteca do Tradutor da Saúde (RAG simples, sem banco e sem API de busca).
 *
 * No navegador:  <script src="app/rag.js"></script>
 *                const base = await (await fetch('dados/biblioteca.json')).json();
 *                const achados = CuidarRAG.buscar(pergunta, base.verbetes);
 *                const msgs = CuidarRAG.montarMensagens(pergunta, achados, base.aviso);
 *                // msgs.system + msgs.user vão para a API da IA
 *
 * No terminal:   node app/rag.js "o que é meld"
 */
(function (global) {
  const STOP = new Set(('a o as os de da do das dos e é que um uma em no na nos nas para por com ' +
    'se me meu minha eu você voce isso esse essa o que qual quais como quando onde porque por que ' +
    'mais muito sobre ser ter tem está esta foi vai pode posso significa quer dizer explicar explica ' +
    'nao ele ela eles elas dele dela seu sua estou agora depois faz ' +
    'pra pro serve servir medico medica falou passou disse remedio remedios tomar tomando')
    .split(' '));

  function normalizar(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(t) {
    return normalizar(t).split(' ').filter(w => w.length > 2 && !STOP.has(w));
  }

  /** Retorna até `limite` verbetes ordenados por relevância (com score). */
  function buscar(pergunta, verbetes, limite = 3, minimo = 2) {
    const p = ' ' + normalizar(pergunta) + ' ';
    const tp = new Set(tokens(pergunta));
    return verbetes.map(v => {
      let score = 0;
      const palavrasUsadas = new Set();   // cada palavra da pergunta pontua 1 vez por verbete
      for (const termo of v.termos || []) {
        const t = normalizar(termo);
        // frase inteira bate (só palavras inteiras: "fe" não pode bater dentro de "efeito")
        if (t && p.includes(' ' + t + ' ')) score += 3 + t.split(' ').length;
        else for (const w of tokens(termo)) {
          if (tp.has(w) && !palavrasUsadas.has(w)) { score += 1; palavrasUsadas.add(w); }
        }
      }
      for (const w of tokens(v.tema)) if (tp.has(w)) score += 1.5;
      for (const w of new Set(tokens(v.explicacao))) if (tp.has(w)) score += 0.3;
      return { verbete: v, score: Math.round(score * 10) / 10 };
    })
      .filter(r => r.score >= minimo)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);
  }

  const SYSTEM = `Você é o Tradutor da Saúde do CUIDAR. Sua tarefa é explicar termos e trechos de documentos médicos em linguagem simples para pacientes e cuidadoras familiares, incluindo pessoas idosas.

Regras:
1. Use SOMENTE as informações dos trechos da biblioteca enviados na mensagem. Não use conhecimento próprio sobre saúde.
2. Se os trechos não respondem à pergunta, diga com gentileza, no campo "diz", que essa informação ainda não está na biblioteca do CUIDAR e sugira levar a dúvida à equipe de saúde.
3. Nunca indique dose, nunca diga para começar, parar ou mudar tratamento, nunca dê diagnóstico nem estime tempo de vida. Nunca interprete o valor de um exame da pessoa.
4. Frases curtas, sem jargão. Se usar um termo técnico, explique entre parênteses, só se a explicação estiver nos trechos.
5. Tom acolhedor e calmo. Em temas de fim de vida, seja respeitoso e nunca alarmista.
6. Responda nos campos:
   - "diz": 1 a 4 frases com o que os trechos explicam sobre a pergunta;
   - "nao_da_para_concluir": 1 ou 2 frases sobre o que não dá para concluir só com essa informação (por exemplo, o que um resultado significa no caso da pessoa);
   - "perguntas": 1 a 3 perguntas para levar à equipe, de preferência as que já estão nos trechos;
   - "trechos_usados": os números dos trechos que você usou (ex.: [1, 2]).
7. No total, no máximo 150 palavras.`;

  /** Monta as mensagens para a IA. Sem trechos relevantes, pede resposta de "não sei". */
  function montarMensagens(pergunta, achados, aviso) {
    const blocos = achados.length
      ? achados.map(({ verbete: v }, i) =>
          `[${i + 1}] ${v.tema}\n${v.explicacao}\nPerguntas para a equipe: ${(v.o_que_perguntar || []).join(' | ')}\nFonte: ${v.fonte}`
        ).join('\n\n')
      : '(nenhum trecho relevante encontrado na biblioteca)';
    return {
      system: SYSTEM,
      user: `Trechos da biblioteca do CUIDAR:\n\n${blocos}\n\n---\nPergunta da pessoa: ${pergunta}`,
      fontes_usadas: achados.map(a => a.verbete.id),
      aviso: aviso || ''
    };
  }

  const api = { buscar, montarMensagens, normalizar, SYSTEM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CuidarRAG = api;

  // Teste pelo terminal
  if (typeof require !== 'undefined' && require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dados', 'biblioteca.json'), 'utf8'));
    const pergunta = process.argv.slice(2).join(' ') || 'o que é cuidado paliativo';
    const achados = buscar(pergunta, base.verbetes);
    console.log(`Pergunta: ${pergunta}`);
    console.log('Verbetes encontrados:', achados.map(a => `${a.verbete.id} (${a.score})`).join(', ') || 'nenhum');
    console.log('\n--- Mensagem que vai para a IA ---\n');
    console.log(montarMensagens(pergunta, achados, base.aviso).user);
  }
})(typeof window !== 'undefined' ? window : globalThis);
