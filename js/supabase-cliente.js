/*
 * CUIDAR — cria a conexão com o Supabase (uma só, usada por todas as páginas).
 * Usa só a URL e a chave PÚBLICA de js/config.js. Quem protege os dados é o RLS.
 */
(function () {
  var cfg = window.CUIDAR_CONFIG;
  var lib = window.supabase;
  if (!cfg || !lib || typeof lib.createClient !== 'function') {
    // Sem internet ou a biblioteca não carregou: as páginas tratam isso.
    window.cuidarSupabase = null;
    return;
  }
  window.cuidarSupabase = lib.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
})();
