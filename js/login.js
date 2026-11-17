/*
 * CUIDAR — tela de login.
 * - Mensagem de erro sempre genérica: nunca diz se o erro foi no e-mail ou na senha.
 * - Não há cadastro público: as contas são criadas pela responsável no painel do Supabase.
 * - Todas as mensagens vão para a tela com textContent (nunca innerHTML).
 */
(function () {
  var sb = window.cuidarSupabase;
  var form = document.getElementById('formLogin');
  var email = document.getElementById('email');
  var senha = document.getElementById('senha');
  var botao = document.getElementById('btnEntrar');
  var mostrar = document.getElementById('mostrarSenha');
  var mensagem = document.getElementById('mensagem');

  var MSG_GENERICA = 'E-mail ou senha incorretos.';
  var MSG_SEM_CONEXAO = 'Não foi possível conectar ao CUIDAR agora. Confira a internet e tente de novo.';
  var MSG_MUITAS = 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';

  function avisar(texto) { mensagem.textContent = texto; }

  function irParaApp() { window.location.replace('./'); }

  // Já está logada? Vai direto para o app.
  if (sb) {
    sb.auth.getUser().then(function (r) {
      if (r && r.data && r.data.user) irParaApp();
    }).catch(function () { /* sem conexão: fica no login */ });
  }

  mostrar.addEventListener('click', function () {
    var visivel = senha.type === 'text';
    senha.type = visivel ? 'password' : 'text';
    mostrar.textContent = visivel ? 'Mostrar senha' : 'Esconder senha';
    mostrar.setAttribute('aria-pressed', String(!visivel));
    senha.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    avisar('');
    var emailDigitado = email.value.trim();
    if (!emailDigitado || !senha.value) {
      avisar('Preencha o e-mail e a senha.');
      (emailDigitado ? senha : email).focus();
      return;
    }
    if (!sb) { avisar(MSG_SEM_CONEXAO); return; }

    botao.disabled = true;
    botao.textContent = 'Entrando…';

    sb.auth.signInWithPassword({ email: emailDigitado, password: senha.value })
      .then(function (r) {
        if (!r.error) { irParaApp(); return; }
        var status = r.error.status;
        if (status === 429) avisar(MSG_MUITAS);
        else if (!status || status >= 500 || r.error.name === 'AuthRetryableFetchError') avisar(MSG_SEM_CONEXAO);
        else avisar(MSG_GENERICA); // credenciais erradas, e-mail não confirmado etc.: sempre a mesma frase
        senha.value = '';
        senha.focus();
      })
      .catch(function () { avisar(MSG_SEM_CONEXAO); })
      .finally(function () {
        botao.disabled = false;
        botao.textContent = 'Entrar';
      });
  });
})();
