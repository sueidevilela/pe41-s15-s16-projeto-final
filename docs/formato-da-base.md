# Formato da base (`dados/biblioteca.json`)

Arquivo JSON com metadados e uma lista de verbetes. Escolhemos JSON (e não planilha) porque o
protótipo lê direto, sem nenhuma API extra. Se quiser mostrar como planilha no pitch, o script de
validação também exporta `dados/biblioteca.csv`.

## Campos de cada verbete

| Campo | Obrigatório | O quê |
|---|---|---|
| `id` | sim | `tx-001` (transplante) ou `cp-001` (paliativos) |
| `area` | sim | `transplante` ou `paliativos` |
| `tema` | sim | Título curto: "Lista única de espera" |
| `termos` | sim | Palavras e jeitos de perguntar que levam a este verbete (inclua o jeito leigo e a sigla) |
| `explicacao` | sim | 40–120 palavras, linguagem simples |
| `o_que_perguntar` | sim | 1–3 perguntas que a pessoa pode levar à equipe |
| `citacao` | não | Até 25 palavras, literal, entre aspas, só de fonte ABERTA ou frase muito curta |
| `fonte` | sim | Uma das fontes de `docs/fontes.md` (ver lista em `scripts/validar_biblioteca.py`) |
| `tipo_fonte` | sim | `aberta` ou `resumo_proprio` |
| `link` | não | URL da fonte (vazio para curso fechado) |
| `data_acesso` | sim | AAAA-MM-DD |
| `respaldo` | não | Artigo/capítulo que confirma o termo |
| `origem` | não | id do trecho limpo de onde saiu (ex.: `paliativos-t012`) |
| `notas_curadoria` | não | Correções feitas, dúvidas |
| `status` | sim | `rascunho` ou `revisado` |
| `revisado_por` | não | Quem revisou (ex.: "Sueide") |

## Exemplo

```json
{
  "id": "tx-002",
  "area": "transplante",
  "tema": "MELD: a pontuação de gravidade",
  "termos": ["meld", "pontuação", "gravidade", "posição na fila", "por que fulano passou na frente"],
  "explicacao": "MELD é uma pontuação calculada a partir de exames de sangue...",
  "o_que_perguntar": ["Qual é o meu MELD hoje?", "De quanto em quanto tempo ele é recalculado?"],
  "fonte": "Portaria GM/MS nº 1.160/2006",
  "tipo_fonte": "aberta",
  "link": "https://goias.gov.br/saude/wp-content/uploads/sites/34/2024/02/portaria-1160-2006-MS.pdf",
  "data_acesso": "2026-11-14",
  "status": "rascunho"
}
```

## Quantos verbetes?
Meta realista até 17/11: **30 a 40 verbetes** (metade transplante, metade paliativos).
Isso também cobre os 20 casos da validação humana com folga.
