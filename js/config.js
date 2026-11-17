/*
 * CUIDAR — configuração PÚBLICA do front (único lugar com dados do Supabase no navegador).
 *
 * Aqui só entram valores que PODEM aparecer no navegador:
 *   - a URL do projeto Supabase;
 *   - a chave PUBLICÁVEL (sb_publishable_...). Ela é pública por natureza: quem
 *     protege os dados é o RLS no banco, não o segredo desta chave.
 *
 * NUNCA coloque aqui: a chave secreta (sb_secret_...), a chave da
 * Anthropic, senhas ou tokens. Esses ficam só no .env do servidor.
 *
 * v7: projeto Supabase PRINCIPAL "cuidar".
 */
window.CUIDAR_CONFIG = Object.freeze({
  ambiente: 'principal',
  supabaseUrl: 'https://yqleyuvkzeoaidvvnpjn.supabase.co',
  supabasePublishableKey: 'sb_publishable_70UE-sMyYUShRRymfjbjAw_hnnZ20wg',
});
