/*
 * CUIDAR — proteção das páginas internas (a "porta").
 *
 * 1. A página começa escondida (regra CSS no <head>: html:not(.cuidar-liberado) body).
 * 2. Ao carregar, confere a sessão no Supabase (getUser valida o login no servidor).
 * 3. Sem sessão válida → vai para login.html. Com sessão → mostra a página e põe o botão "Sair".
 *
 * Importante: isto é só a PORTA. Esconder a tela não protege dados; quem protege
 * é o RLS no banco (a fechadura), feito na Fase 4.
 */
(function () {
  var raiz = document.documentElement;
  var sb = window.cuidarSupabase;

  function irParaLogin() { window.location.replace('login.html'); }

  if (!sb) { irParaLogin(); return; }

  sb.auth.getUser()
    .then(function (r) {
      if (!r || r.error || !r.data || !r.data.user) { irParaLogin(); return; }
      raiz.classList.add('cuidar-liberado');
      quandoPronto(montarBotaoSair);
    })
    .catch(irParaLogin);

  // Saiu em outra aba, ou a sessão terminou: volta para o login.
  sb.auth.onAuthStateChange(function (evento) {
    if (evento === 'SIGNED_OUT') irParaLogin();
  });

  function quandoPronto(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function montarBotaoSair() {
    if (document.getElementById('sairBtn')) return;

    var estilo = document.createElement('style');
    estilo.textContent =
      '.sair-btn{font-weight:800}' +
      '.sair-btn .sair-txt{display:inline}' +
      '.sair-btn.sair-solto{position:fixed;top:72px;right:16px;z-index:70}';
    document.head.appendChild(estilo);

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.id = 'sairBtn';
    botao.className = 'pill-btn sair-btn';
    botao.setAttribute('aria-label', 'Sair do CUIDAR');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'i');
    svg.setAttribute('aria-hidden', 'true');
    var uso = document.createElementNS(svgNS, 'use');
    uso.setAttribute('href', '#i-arrow-r');
    svg.appendChild(uso);

    var texto = document.createElement('span');
    texto.className = 'sair-txt';
    texto.textContent = 'Sair';

    botao.appendChild(svg);
    botao.appendChild(texto);

    botao.addEventListener('click', function () {
      botao.disabled = true;
      texto.textContent = 'Saindo…';
      sb.auth.signOut().catch(function () {}).finally(irParaLogin);
    });

    var lugar = document.querySelector('.topbar .tools');
    if (lugar) lugar.appendChild(botao);
    else { botao.classList.add('sair-solto'); document.body.appendChild(botao); }
  }
})();
