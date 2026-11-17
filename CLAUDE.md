# CUIDAR — Biblioteca do Tradutor da Saúde (base para RAG)

Você está ajudando a Sueide a construir a **base de dados de conhecimento** do CUIDAR,
um sistema de gestão da jornada de saúde hepática (transplante de fígado e cuidados paliativos).
Esta base é a "biblioteca" que o **Tradutor da Saúde** consulta antes de chamar a IA.

Projeto final do curso da {reprograma}. Entrega: 18/11/2026, 12h. Meta interna: tudo pronto em 17/11, 22h.

## O que estamos construindo (e o que NÃO estamos)

- SIM: `dados/biblioteca.json` — verbetes curtos, em português, em linguagem simples,
  cada um com fonte, link, data de acesso e status de revisão.
- SIM: um buscador simples (`app/rag.js`) que acha os verbetes certos para a pergunta
  e monta o prompt do Tradutor.
- NÃO: base de pacientes (real ou fictícia). Fica fora deste kit.
- NÃO: app buscando na internet ao vivo. A coleta é feita uma vez, curada, e guardada no JSON.

## Regras que você deve seguir sempre

1. **Nunca invente conteúdo de saúde.** Todo verbete precisa vir de uma fonte listada em
   `docs/fontes.md` ou das anotações da Sueide em `dados/brutos/`. Se não achar fonte, não crie o verbete:
   registre a lacuna em `docs/lacunas.md`.
2. **Leia `docs/regras-higienizacao.md` antes de gerar qualquer verbete.**
3. **Direitos autorais:** livro *Cuidar até o fim*, curso *Como Trazer Paz para a Morte* e o
   *Manual de Transplante Hepático (USP, 2024)* são obras protegidas. Nunca copie trechos longos.
   Escreva com suas palavras, curto, e cite a fonte. Citação literal: no máximo uma frase curta por verbete.
4. **LGPD:** nada de nome, CPF, telefone, e-mail, endereço ou caso clínico de pessoa real.
   O script `scripts/validar_biblioteca.py` checa isso e precisa passar antes de qualquer commit.
5. **Sem conduta clínica:** verbetes explicam o que é, para que serve, o que perguntar à equipe.
   Nunca dose de remédio, nunca "pode parar", nunca diagnóstico.
6. **Público:** pacientes e cuidadoras familiares, incluindo pessoas idosas. Frases curtas,
   sem jargão, sem siglas sem explicação. Tom acolhedor, nunca alarmista.
7. `dados/brutos/` **não vai para o GitHub** (já está no `.gitignore`). Só os dados limpos e citados.
8. Todo verbete novo entra com `"status": "rascunho"`. Só a Sueide muda para `"revisado"`.

## Onde está cada coisa

| Caminho | O quê |
|---|---|
| `ROTEIRO.md` | Passo a passo com os prompts para colar aqui |
| `docs/fontes.md` | Fontes aprovadas, links e como usar cada uma |
| `docs/regras-higienizacao.md` | O que limpar, como reescrever, checklist |
| `docs/formato-da-base.md` | Campos de cada verbete, com exemplo |
| `schema/biblioteca.schema.json` | Schema formal (validado pelo script) |
| `dados/brutos/` | Anotações originais (privado) |
| `dados/limpos/` | Saída do script de limpeza (trechos limpos, ainda não são verbetes) |
| `dados/biblioteca.json` | A base final que o app consulta |
| `scripts/limpar_transcricao.py` | Limpa a transcrição do curso e quebra em trechos |
| `scripts/validar_biblioteca.py` | Valida campos, fontes, tamanho e dados pessoais |
| `app/rag.js` | Busca os verbetes e monta o prompt (usar no protótipo) |
| `prompts/tradutor-da-saude.md` | Prompt de sistema do Tradutor |
| `prova/` | Modelos das provas do edital (onde é usada + dados higienizados) |

## Comandos

```bash
python3 scripts/limpar_transcricao.py "dados/brutos/INFORMAÇÕES SOBRE CUIDADOS PALIATIVOS.docx"
python3 scripts/validar_biblioteca.py
node app/rag.js "o que é cuidado paliativo"   # teste rápido da busca no terminal
```


---

# CUIDAR — regras do projeto

## Contexto
- CUIDAR é o projeto final da Sueide no curso da reprograma: um sistema de gestão da jornada de saúde hepática (transplante), com funcionalidades de IA, sendo a principal o **Tradutor da Saúde** (explica termos e exames em linguagem simples).
- É um **protótipo acadêmico com dados fictícios**. Não há pacientes reais. Mesmo assim, tratamos tudo como dado de saúde (dado sensível na LGPD).
- Público: pacientes, inclusive pessoas idosas, e cuidadoras familiares. Interfaces e mensagens precisam ser claras, com letra grande e linguagem simples.
- Stack: HTML/CSS/JS no front, servidor local durante o desenvolvimento, Supabase (Auth, Postgres, Edge Functions), API da Anthropic para a IA. Hospedagem na Vercel só no final.
- A base de dados do edital é a **biblioteca do Tradutor** (documentos de referência higienizados, usados como base de RAG).

## Regras de segurança (inegociáveis)
1. **Nenhum segredo no código.** A chave da Anthropic, a service role/secret do Supabase e qualquer token de WhatsApp ou automação ficam só em variáveis de ambiente do servidor (`.env` local, secrets do Supabase, variáveis da Vercel). No front, só a chave pública (anon/publishable) e a URL do Supabase.
2. **Nunca abra, imprima ou copie o conteúdo de `.env`.** Se precisar saber quais variáveis existem, use `.env.example`.
3. **Toda tabela nasce com RLS ativado e com políticas na mesma alteração.** Nada de "depois eu ativo".
4. **A tela é a porta; o banco é a fechadura.** Esconder botão não é segurança. Toda regra de acesso precisa existir no RLS ou na edge function.
5. **Segurança não se prioriza, se resolve no mesmo instante.** Se encontrar um problema de segurança (chave exposta, tabela sem RLS, dado aberto), pare o que estiver fazendo e me avise antes de seguir.
6. **Texto vindo da IA ou da usuária é renderizado com `textContent`**, nunca com `innerHTML`.
7. **Somente dados fictícios.** Nunca crie seeds ou exemplos com nomes, CPFs, telefones ou prontuários que pareçam reais.
8. **Pergunte antes de:** apagar dados ou tabelas, desativar RLS, rodar SQL direto no banco, `git push --force`, `git reset --hard`, reescrever histórico ou instalar dependências novas.
9. **Escopo:** não altere funcionalidades que já funcionam fora do que foi pedido na tarefa. Se uma mudança de segurança exigir mexer em algo existente, explique antes.
10. Antes de cada commit, rode `bash scripts/checar-segredos.sh`.

## Versões e ambientes
- **v6 é somente leitura.** Nunca altere, mova, renomeie ou apague arquivos da v6.
- Toda alteração é feita e testada primeiro no **ambiente de testes** (cópia da v6, com Supabase de testes e o aviso "AMBIENTE DE TESTES" na tela).
- A **v7** só é criada, a partir da v6, depois que a Sueide escrever exatamente "APROVADO: pode criar a v7".
- Nada de migrations ou deploy no projeto Supabase principal antes disso.
- Antes de alterar qualquer arquivo, confira em qual pasta, branch e projeto Supabase você está.

## Esta pasta: v7
- Esta pasta (`Downloads/cuidar-v7`) é a **v7**, criada em 17/11/2026 a partir da v6 com a camada de segurança validada no ambiente de testes.
- A v6 continua em `Downloads/kit-biblioteca-cuidar/kit-biblioteca-cuidar` (somente leitura). O ambiente de testes é `Downloads/cuidar-teste`.
- Projeto Supabase da v7: **principal** `cuidar` (ref `yqleyuvkzeoaidvvnpjn`). Testes: `cuidar-teste` (ref `vyfpvhzgkcvnkwtbuzig`).
- Custo de IA zero: o Tradutor usa só o modo biblioteca (sem chave da Anthropic).
- Mudanças novas: primeiro no ambiente de testes, depois aqui.
