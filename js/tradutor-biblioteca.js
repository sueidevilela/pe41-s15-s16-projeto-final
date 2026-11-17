/*
 * CUIDAR — Tradutor da Saúde em MODO BIBLIOTECA, rodando no navegador.
 *
 * - Custo zero: NÃO chama nenhuma IA. Mostra o verbete revisado da biblioteca do CUIDAR
 *   (dados/biblioteca.json) que responde à pergunta, com fonte e perguntas para a equipe.
 * - Privacidade: a pergunta não sai do navegador e não é registrada em lugar nenhum.
 * - Mesma lógica do modo biblioteca do servidor (app/servidor.js), para dar as mesmas respostas.
 * - Depende de app/rag.js (CuidarRAG.buscar).
 * - Quem desenha a resposta na tela usa textContent (nunca innerHTML).
 */
(function (global) {
  var MAX_CARACTERES = 3000;
  // Mesmos padrões de dado pessoal da tela e do servidor (CPF, cartão do SUS, telefone, e-mail).
  var DADO_PESSOAL = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\bcpf\b|cart[aã]o (do )?sus|\bcns\b|[\w.+-]+@[\w-]+\.[\w.]+|\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/i;

  /*
   * GUARDRAILS: regras que rodam ANTES da busca na biblioteca.
   * Textos fixos, sem orientação clínica nova: só encaminham para a equipe ou para o atendimento.
   * Ordem importa: urgência vem primeiro.
   */
  var GUARDRAILS = [
    {
      status: 'alerta',
      titulo: 'Atenção: isso pode ser urgente',
      icone: 'alert',
      padrao: /febre|calafrio|sangrando|sangramento|v[oô]mit\S* (com|de) sangue|vomitando sangue|sangue nas fezes|fezes (pretas|escuras|com sangue)|falta de ar|sem ar|desmai|convuls|confus[aã]o mental|desorientad|dor (muito )?forte|olhos? amarel|pele amarel|n[aã]o (consegue|consigo) acordar/i,
      mensagem: 'Se a pessoa está com esse sintoma agora, não espere: ligue para a equipe de transplante ou de saúde que acompanha você. Em emergência, ligue para o SAMU (192) ou vá ao pronto-socorro mais próximo.',
    },
    {
      status: 'orientacao',
      titulo: 'O CUIDAR não orienta dose de remédio',
      icone: 'pill',
      padrao: /\bdose\b|metade d[oa]|meio comprimido|quantos comprimidos|(parar|deixar|esquecer|esqueci) de tomar|pular (a|o|uma) (dose|rem)|(aumentar|diminuir|mudar) (a )?dose|tomar (o |a |meu |minha |mais |menos )?(rem[eé]dio|comprimido|tacrolimo|ciclosporina|imunossupressor)/i,
      mensagem: 'Não mude, não pule e não pare nenhum remédio por conta própria. Ligue para a equipe que receitou e conte o que está acontecendo: ela vai dizer o que fazer no seu caso.',
    },
    {
      status: 'orientacao',
      titulo: 'Antes de usar, fale com a equipe',
      icone: 'leaf',
      padrao: /\bch[aá]s?(?![a-zà-ú])|\berva|rem[eé]dio caseiro|suplemento|garrafada/i,
      mensagem: 'Antes de usar qualquer chá, erva, suplemento ou remédio caseiro, converse com a equipe de saúde que acompanha você. Leve o nome do produto na consulta.',
    },
    {
      status: 'acolhimento',
      titulo: 'Você não está sozinha nisso',
      icone: 'heart',
      padrao: /\bmedo\b|ansiedade|ansios[ao]|triste|tristeza|ang[uú]sti|desesper|chorando|n[aã]o aguento/i,
      mensagem: 'É natural sentir medo e preocupação nessa fase. Converse com a equipe de saúde sobre o que você está sentindo: muitos serviços têm psicólogo e assistente social para ajudar pacientes e famílias. Se precisar conversar com alguém agora, o CVV atende 24 horas, de graça, pelo telefone 188.',
    },
  ];

  function guardrail(texto) {
    for (var i = 0; i < GUARDRAILS.length; i++) {
      var g = GUARDRAILS[i];
      if (g.padrao.test(texto)) return { status: g.status, titulo: g.titulo, icone: g.icone, mensagem: g.mensagem };
    }
    return null;
  }

  var basePromessa = null;

  function carregar() {
    if (!basePromessa) {
      basePromessa = fetch('dados/biblioteca.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('biblioteca ' + r.status); return r.json(); })
        .catch(function (e) { basePromessa = null; throw e; });
    }
    return basePromessa;
  }

  function fonteDe(v) { return v.tema + ' — ' + v.fonte + (v.link ? ' (' + v.link + ')' : ''); }

  /** Valida o texto. Retorna null se estiver ok, ou a resposta de erro. */
  function validar(texto) {
    if (typeof texto !== 'string' || !texto.trim()) {
      return { status: 'erro', mensagem: 'Cole um termo ou trecho para explicar.' };
    }
    if (texto.length > MAX_CARACTERES) {
      return { status: 'erro', mensagem: 'O texto é muito longo (mais de ' + MAX_CARACTERES.toLocaleString('pt-BR') + ' letras). Cole só o trecho que você quer entender.' };
    }
    if (DADO_PESSOAL.test(texto)) {
      return { status: 'dado_pessoal', mensagem: 'O texto parece ter um dado pessoal (CPF, cartão do SUS, telefone ou e-mail). Apague esse dado e tente de novo. Nada foi enviado.' };
    }
    return null;
  }

  function traduzir(textoBruto) {
    var texto = typeof textoBruto === 'string' ? textoBruto.trim() : textoBruto;
    var erro = validar(texto);
    if (erro) return Promise.resolve(erro);
    var regra = guardrail(texto);
    if (regra) return Promise.resolve(regra);
    if (!global.CuidarRAG) return Promise.resolve({ status: 'erro', mensagem: 'Não foi possível abrir a biblioteca agora. Recarregue a página.' });

    return carregar().then(function (base) {
      var aviso = base.aviso + ' Em emergência, ligue para o SAMU (192).';
      var achados = global.CuidarRAG.buscar(texto, base.verbetes);

      if (!achados.length) {
        return {
          status: 'sem_verbete',
          mensagem: 'Esse tema ainda não está na biblioteca do CUIDAR. Leve essa dúvida à equipe de saúde que acompanha você.',
          perguntas: ['Vocês podem me explicar este trecho em palavras simples?'],
          aviso: aviso,
        };
      }

      var principal = achados[0].verbete;
      // "Veja também" só com temas da mesma fonte (evita sugestão sem relação, que pode assustar).
      var outros = achados.slice(1).map(function (a) { return a.verbete; })
        .filter(function (v) { return v.fonte === principal.fonte; });
      var frases = principal.explicacao.split(/(?<=[.!?:])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).filter(Boolean);

      return {
        status: 'ok',
        modo: 'biblioteca',
        tema: principal.tema,
        diz: frases,
        nao: [
          'Esta é uma explicação geral da biblioteca do CUIDAR, não do seu caso.',
          'O que isso significa para você só a equipe de saúde que acompanha você pode dizer.',
        ],
        perguntas: principal.o_que_perguntar || [],
        relacionados: outros.map(function (v) { return v.tema; }),
        fontes: [fonteDe(principal)],
        aviso: aviso,
      };
    }).catch(function () {
      return { status: 'erro', mensagem: 'Não foi possível abrir a biblioteca agora. Confira a internet e tente de novo.' };
    });
  }

  global.CuidarTradutor = { carregar: carregar, traduzir: traduzir, validar: validar, guardrail: guardrail, MAX_CARACTERES: MAX_CARACTERES };
})(window);
