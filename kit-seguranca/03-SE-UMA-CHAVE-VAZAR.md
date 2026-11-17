# Se uma chave vazar — passo a passo de emergência

**Regra de ouro:** apagar a chave do código **não basta**. Se ela foi para o GitHub, considere que já foi copiada (robôs varrem repositórios públicos em minutos). A única saída é **invalidar a chave antiga**.

Ordem: **1. desativar → 2. trocar → 3. limpar → 4. conferir**.

## 1. Desativar a chave vazada (primeiro, sempre)

| Chave | Onde desativar |
|---|---|
| Anthropic (`sk-ant-...`) | Console da Anthropic → API Keys → desativar ou apagar a chave |
| Supabase secreta (`sb_secret_...`) | Painel do Supabase → Project Settings → API Keys → apagar a chave secreta e criar outra |
| Supabase `service_role` antiga (JWT `eyJ...`) | Painel do Supabase → Project Settings → API Keys: migrar para as chaves novas e desativar as antigas (ou trocar o JWT secret do projeto, o que invalida anon e service_role juntas) |
| Token do WhatsApp / automação | Painel do provedor → revogar o token |
| Chave pública (anon / `sb_publishable_`) | Não é emergência: ela foi feita para ficar no navegador. Mas confira se o RLS está ligado em tudo |

## 2. Trocar pela nova

1. Gere a chave nova no mesmo painel.
2. Coloque **você mesma** no `.env` local.
3. Atualize os secrets do servidor:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=cole_aqui_no_terminal
   ```
   (Na Vercel: Settings → Environment Variables → editar → fazer redeploy.)
4. Teste se o app continua funcionando.

## 3. Limpar o código

1. Tire a chave do arquivo e use a variável de ambiente.
2. Confirme que `.env` está no `.gitignore`.
3. Rode `bash scripts/checar-segredos.sh`.
4. Faça o commit da correção.
5. Histórico do git: como a chave antiga **já foi desativada**, ela não serve para mais nada, e reescrever o histórico é opcional. Se quiser limpar, peça ajuda antes (é uma operação que pode estragar o repositório).

## 4. Conferir estragos

- Console da Anthropic → Usage: houve uso que você não reconhece?
- Supabase → Logs: acessos estranhos? Dados alterados?
- Supabase / Vercel → Billing: algum consumo fora do normal?
- Anote o que aconteceu, quando e o que foi feito (vira aprendizado no `docs/seguranca.md`).

## Prevenção

- Hook de pre-commit rodando `checar-segredos.sh`.
- Limite de gasto mensal na Anthropic: se a chave vazar, o estrago tem teto.
- Nunca colar chave em chat, print, slide ou mensagem.
