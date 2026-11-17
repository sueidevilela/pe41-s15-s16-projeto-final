# Roteiro — montar a biblioteca do Tradutor da Saúde no Claude Code

Tempo total estimado: 6 a 9 horas, divididas assim:
- **Sáb 14/11:** passos 0 a 3 (preparar e paliativos)
- **Dom 15/11:** passos 4 a 6 (transplante, revisão, validação)
- **Seg 16/11:** passos 7 e 8 (ligar no protótipo e montar a prova)
- **Ter 17/11:** folga para ajustes. Meta: pronto às 22h.

Cada passo tem um prompt pronto. Copie o bloco e cole no Claude Code.

---

## Passo 0 — Preparar a pasta (5 min, você)
1. Coloque a pasta `kit-biblioteca-cuidar` dentro da pasta do projeto CUIDAR
   (ou use-a como a pasta do projeto, junto com o `cuidar_prototipo.html`).
2. Copie o arquivo **INFORMAÇÕES SOBRE CUIDADOS PALIATIVOS.docx** para `dados/brutos/`.
3. Abra o Claude Code nessa pasta.

## Passo 1 — Apresentar o kit ao Claude Code (5 min)
```
Leia o CLAUDE.md, docs/fontes.md, docs/regras-higienizacao.md e docs/formato-da-base.md.
Depois me resuma em 5 linhas o que vamos construir e as regras que você vai seguir.
Não crie nem altere nenhum arquivo ainda.
```
Confira se ele citou: só fontes aprovadas, sem dado pessoal, sem dose, status "rascunho".

## Passo 2 — Limpar as anotações do curso (10 min)
```
Rode: python3 scripts/limpar_transcricao.py "dados/brutos/INFORMAÇÕES SOBRE CUIDADOS PALIATIVOS.docx"
Me mostre o relatório e os trechos marcados com suspeita de erro de transcrição.
```
Guarde o `dados/limpos/relatorio_limpeza.md`: ele vai para a prova.

## Passo 3 — Transformar trechos em verbetes de paliativos (1h30 a 2h)
Faça em lotes de 10 trechos, para conseguir revisar.
```
Leia dados/limpos/trechos_paliativos.json, trechos paliativos-t001 a paliativos-t010.
Para cada trecho, decida se ele vira verbete, seguindo docs/regras-higienizacao.md.
Mostre primeiro uma tabela: id do trecho | vira verbete? | tema proposto | motivo.
Espere eu aprovar antes de escrever no dados/biblioteca.json.
Regras: escreva com suas palavras (é obra protegida, nada de copiar frases), 40 a 120 palavras,
linguagem para pessoa idosa, status "rascunho", campo "origem" com o id do trecho,
e anote em "notas_curadoria" qualquer erro de transcrição que você corrigiu.
Se um mesmo tema aparecer em vários trechos, faça um verbete só.
```
Depois de aprovar a tabela: `Pode escrever os verbetes aprovados e rodar o validador.`
Repita para t011–t020, t021–t030, até o fim.

Temas que provavelmente vão aparecer nas suas anotações (confirme no texto):
jornada do adoecimento (cura → controle → evitar a morte → aliviar o sofrimento),
luto antecipatório, as dimensões do sofrimento, cuidado paliativo não é desistir,
preparo e expectativa da família, a espera de um milagre, o espaço afetivo,
mitos e verdades sobre o fim da vida, dor total (Cicely Saunders).

Meta: **15 a 20 verbetes de paliativos**.

## Passo 4 — Coletar e escrever verbetes de transplante (2h a 3h)
```
Vamos montar a parte de transplante. Use só as fontes ABERTAS de docs/fontes.md.
1. Abra cada link (WebFetch) e me diga em uma linha o que tem de útil para pacientes e cuidadoras.
   Se um link não abrir ou não for o documento esperado, me avise e registre em docs/lacunas.md.
2. Proponha uma tabela de temas: tema | fonte | trecho/página onde aparece.
   Só proponha tema que esteja de fato na fonte.
Espere eu aprovar antes de escrever.
```
Depois: `Escreva os verbetes aprovados (tx-003 em diante), rode o validador e me mostre o resultado.`

Comece pelo blog do Prof. Luiz Carneiro, que já é escrito para pacientes:
```
Abra https://profluizcarneiro.com.br/blog/ e as seções Transplantes e Doenças do site.
Use só os posts de fígado e transplante listados em docs/fontes.md.
Para cada post, proponha 1 ou 2 verbetes: tema | post | link do post.
Reescreva com suas palavras (o site tem direitos reservados), cite o post no campo fonte
e coloque o link do post específico. Em exames (TGO, GGT), explique o que o exame mede,
sem interpretar valores. Espere eu aprovar antes de escrever.
```

Temas para procurar nas fontes (só entram se a fonte trouxer):
icterícia, nódulo no fígado, esteatose, fibrose e cirrose, exames TGO e GGT,
quem indica o transplante, avaliação antes do transplante, número de registro na Central (RICT),
doador falecido e doador vivo, morte encefálica, o fígado se regenera,
acompanhamento e exames depois do transplante, o que são imunossupressores (sem doses),
por que não faltar às consultas depois do transplante.

Meta: **15 a 20 verbetes de transplante**.

Se você tiver anotações do **Manual de Transplante Hepático (USP, 2024)**, coloque em `dados/brutos/`
e peça: `Use minhas anotações em dados/brutos/<arquivo> como fonte "Manual de Transplante Hepático (USP, 2024), cap. X", tipo resumo_proprio.`

## Passo 5 — Sua revisão (1h a 1h30, você)
Abra `dados/biblioteca.csv` (gerado pelo validador) no Excel ou Google Sheets e leia verbete por verbete
com o checklist de `docs/regras-higienizacao.md`. Para aprovar:
```
Marque como "revisado", com revisado_por "Sueide", os verbetes: tx-001, tx-002, cp-001 ...
Corrija no cp-005: <o que você quer mudar>.
```

## Passo 6 — Validar (5 min)
```
Rode python3 scripts/validar_biblioteca.py. Se tiver erro, corrija e rode de novo até dar OK.
```

## Passo 7 — Ligar a biblioteca no protótipo (1h a 2h)
```
Leia cuidar_prototipo.html, a tela "Tradutor da Saúde".
Integre o app/rag.js: ao enviar a pergunta, carregar dados/biblioteca.json, buscar os verbetes,
montar as mensagens com CuidarRAG.montarMensagens e chamar a API do Claude.
Requisitos:
- A chave da API NÃO pode ficar no HTML nem ir para o GitHub. Crie um servidor local simples
  (Node) que guarda a chave num arquivo .env e repassa a chamada. Adicione .env ao .gitignore.
- Mostrar na tela: a explicação, as fontes usadas e o aviso "não substitui a equipe de saúde".
- Se nenhum verbete for encontrado, mostrar que o tema ainda não está na biblioteca.
- Registrar cada uso em logs/tradutor.jsonl (data, pergunta, ids dos verbetes, resposta), sem dados pessoais.
Antes de mexer, me explique o plano em 5 passos e espere eu aprovar.
```
Os registros em `logs/tradutor.jsonl` ajudam na prova e na validação humana (20 casos).

## Passo 8 — Montar a prova do edital (30 min)
```
Preencha prova/PROVA-BASE-DE-DADOS.md com os números reais do relatorio_limpeza.md e do validador,
e com um exemplo de antes e depois (trecho de origem do cp-002 encurtado + verbete final).
Gere também um diagrama simples do fluxo "pergunta → busca → IA → resposta com fonte".
```
Tire os 2 prints indicados no arquivo.

## Passo 9 — Subir para o GitHub
```
Confira se dados/brutos/, .env e logs/ estão no .gitignore. Rode o validador.
Depois faça o commit com a mensagem "Biblioteca do Tradutor da Saúde: N verbetes revisados".
```

---

## Se der tempo (opcional)
- Usar os 20 casos da validação humana como perguntas de teste: `node app/rag.js "<pergunta>"` para cada um
  e ver se o verbete certo aparece. Pergunta que não acha nada vira verbete novo ou entra em docs/lacunas.md.
