# Kit de Segurança do CUIDAR para o Claude Code

Kit para implementar login, segredos, RLS, limites de uso/custo e guardrails do Tradutor da Saúde no CUIDAR, com o Claude Code fazendo o trabalho em fases e parando para você testar entre uma e outra.

## O que tem no kit

| Arquivo | Para quê | Onde colocar |
|---|---|---|
| `CLAUDE.md` | Regras permanentes que o Claude Code lê em toda sessão | Raiz do projeto (se já existir um, cole este conteúdo no fim) |
| `01-PROMPT-PRINCIPAL.md` | O prompt que você cola no Claude Code | Pode ficar em `kit-seguranca/` |
| `tradutor/system-prompt.md` | Prompt de sistema do Tradutor da Saúde, com guardrails | O Claude Code move para a pasta da edge function |
| `supabase/rls-modelo.sql` | Modelo das políticas de RLS | O Claude Code adapta aos nomes reais das suas tabelas |
| `config/gitignore-modelo.txt` | Conteúdo mínimo do `.gitignore` | Vira `.gitignore` na raiz |
| `config/env.example` | Modelo de variáveis, sem valores | Vira `.env.example` na raiz |
| `scripts/checar-segredos.sh` | Procura chaves escondidas no código e no histórico do git | `scripts/` na raiz |
| `02-CHECKLIST-VALIDACAO.md` | Os testes que provam que a segurança funciona | `docs/` |
| `03-SE-UMA-CHAVE-VAZAR.md` | Passo a passo de emergência | `docs/` |
| `04-PITCH-SEGURANCA.md` | Roteiro do trecho de segurança no pitch de 5 min | Só para você |

## Passo a passo

1. **Proteja antes de qualquer commit.** Copie `config/gitignore-modelo.txt` para a raiz como `.gitignore` (ou junte com o que já existe). Rode `git status` e confirme que nenhum `.env` aparece na lista.
2. **Crie um ponto de retorno.** `git add -A` e `git commit -m "estado antes da segurança"`. Se algo quebrar, dá para voltar.
3. **Copie o kit** para a raiz do projeto como pasta `kit-seguranca/` e o `CLAUDE.md` para a raiz.
4. **Crie um projeto Supabase só para testes** (ex.: "cuidar-teste") e, nele, as contas fictícias A e B. Assim o RLS e a edge function são testados sem tocar no projeto principal.
5. **Abra o Claude Code na pasta do projeto**, entre no modo de planejamento (Shift+Tab até aparecer "plan mode") e cole o conteúdo de `01-PROMPT-PRINCIPAL.md`.
6. **Siga fase por fase.** O Claude Code monta um ambiente de testes (cópia da v6) e faz tudo lá. A v6 fica intacta. Ao fim de cada fase: teste o que ele pedir e responda "pode seguir".
7. **Teste com calma o ambiente de testes** com o checklist. Quando estiver satisfeita, escreva exatamente **APROVADO: pode criar a v7**. Só aí ele cria a v7 a partir da v6, com as alterações validadas.
8. **As chaves são com você.** Você mesma cola as chaves no `.env` e roda o `supabase secrets set`. Nunca cole uma chave no chat do Claude Code.
9. **Feche com o checklist** (`02-CHECKLIST-VALIDACAO.md`) e tire prints. Eles viram prova no pitch.

## Tarefas manuais (só você consegue fazer, no painel)

- Supabase: criar o projeto de testes e, nele, em Authentication → Users, as contas fictícias A e B (a "intrusa"). Na Fase 8, criar as contas também no projeto principal.
- Supabase → Authentication → Sign In / Providers: desligar o cadastro público ("Allow new users to sign up"), já que é um protótipo com contas criadas por você.
- Console da Anthropic: definir limite de gasto mensal baixo para a chave do projeto.
- Supabase e, mais tarde, Vercel: conferir os limites do plano gratuito.

## Tempo estimado (prazo: entrega 18/11, 12h)

| Fase | Tempo aproximado |
|---|---|
| 0 Diagnóstico | 15 min |
| 1 Ambiente de testes | 20 min |
| 2 Segredos | 20 min |
| 3 Login | 40 min |
| 4 RLS | 30 min |
| 5 Tradutor seguro | 60 min |
| 6 Custos e automação | 20 min |
| 7 Validação | 40 min |
| 8 Criar a v7 | 30 min |

Se o tempo apertar, a ordem de corte é: Fase 6 vira "configurado no painel + citado no pitch", e os testes automáticos da Fase 7 viram testes manuais com print. A Fase 8 não se corta: sem ela, a v7 não existe.
