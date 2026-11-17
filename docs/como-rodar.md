# CUIDAR · Biblioteca do Tradutor da Saúde

Base de conhecimento (RAG) que o Tradutor da Saúde do CUIDAR consulta para explicar termos de
transplante de fígado e cuidados paliativos em linguagem simples, sempre com fonte.

- `dados/biblioteca.json` — verbetes curados e citados
- `app/rag.js` — busca os verbetes e monta o prompt
- `prompts/tradutor-da-saude.md` — prompt da IA
- `scripts/` — limpeza das anotações e validação (fontes, LGPD, sem conduta clínica)
- `app/servidor.js` — servidor local: abre o protótipo e liga o Tradutor à biblioteca e à IA
- `cuidar_v5.html` — protótipo do CUIDAR com o Tradutor da Saúde funcionando

## Como rodar o Tradutor da Saúde
1. Instale o Node.js (versão LTS) e, nesta pasta, rode `npm install`.
2. Rode `npm start` e abra http://localhost:3000. No menu, entre em **Tradutor da Saúde**.
3. (Opcional) Para ligar a IA: copie `.env.example` para `.env` e cole a sua chave da API da Anthropic
   (criada em https://console.anthropic.com; a conta precisa ter crédito). O `.env` não vai para o GitHub.
   Reinicie com `npm start`.

O Tradutor tem dois modos, escolhidos sozinhos pelo servidor:
- **Modo biblioteca (sem chave, sem custo):** mostra o verbete revisado que responde à pergunta, exatamente
  como está na biblioteca, com a fonte, as perguntas para a equipe e outros temas da mesma fonte.
- **Modo IA (com chave):** a IA explica a pergunta usando só os verbetes encontrados. Se a IA não responder
  (sem crédito, sem internet), o servidor volta sozinho para o modo biblioteca.

Sem o servidor (abrindo o `cuidar_v5.html` com duplo clique), o Tradutor mostra só respostas de exemplo.

Como funciona: a pergunta é buscada na biblioteca (`app/rag.js`); no modo IA, o Claude Opus 5.5 recebe só os
verbetes encontrados e responde em três blocos, com as fontes. Se nenhum verbete é encontrado, a IA não é
chamada e a tela avisa que o tema ainda não está na biblioteca. Texto com CPF, cartão do SUS, telefone ou
e-mail é bloqueado antes de sair do computador. Cada uso fica em `logs/tradutor.jsonl` (local, fora do GitHub).

Testes: `python scripts/validar_biblioteca.py` (base) e `npm run testar-busca` (busca).

Conteúdo educativo. Não substitui a orientação da equipe de saúde.
Sem dados de pacientes. Projeto final do curso da {reprograma}, 2026.
