# Kit — Central de Ajuda do CUIDAR

Kit para implementar a **Central de Ajuda (FAQ)** no protótipo `cuidar_prototipo.html` usando o Claude Code.

Público principal: **pessoas idosas**, além de familiares e cuidadores.

---

## O que tem no kit

| Arquivo | Para que serve |
|---|---|
| `01-PROMPT-PRINCIPAL.md` | O prompt que você cola no Claude Code para implementar a Central de Ajuda |
| `02-faq-conteudo.json` | Todas as perguntas e respostas, já escritas, em formato de dados |
| `03-acessibilidade.md` | Regras de acessibilidade para o público idoso (o Claude Code lê este arquivo) |
| `04-roteiro-prints.md` | Lista dos 13 prints: qual tela, o que destacar e o nome do arquivo |
| `05-checklist-validacao.md` | Checklist para conferir o resultado + roteiro de teste com as testadoras |
| `06-prompts-de-ajuste.md` | Prompts curtos para as etapas seguintes (colocar os prints, corrigir, revisar o app) |

---

## Passo a passo

**Antes de começar (5 min)**

1. Crie uma pasta do projeto, por exemplo `cuidar/`.
2. Coloque nela o `cuidar_prototipo.html`.
3. Crie dentro dela uma pasta `kit-ajuda/` e copie para lá **todos os arquivos deste kit**.
4. Crie também a pasta vazia `img/ajuda/` (os prints vão para lá depois).

A estrutura deve ficar assim:

```
cuidar/
├── cuidar_prototipo.html
├── img/
│   └── ajuda/              ← prints (etapa 3)
└── kit-ajuda/
    ├── README.md
    ├── 01-PROMPT-PRINCIPAL.md
    ├── 02-faq-conteudo.json
    ├── 03-acessibilidade.md
    ├── 04-roteiro-prints.md
    ├── 05-checklist-validacao.md
    └── 06-prompts-de-ajuste.md
```

**Etapa 1 — Implementar (30 a 60 min)**

1. Abra o Claude Code na pasta `cuidar/`.
2. Abra o `01-PROMPT-PRINCIPAL.md`, copie **só o bloco do prompt** e cole no Claude Code.
3. O Claude Code vai primeiro **mostrar um plano e esperar sua aprovação**. Leia o plano e responda "pode seguir" (ou peça ajustes).
4. Ao final de cada fase ele para e mostra o que fez. Abra o HTML no navegador e confira.

**Etapa 2 — Conferir (15 min)**

Use o `05-checklist-validacao.md`. O que não estiver certo, peça ajuste com os prompts do `06-prompts-de-ajuste.md`.

**Etapa 3 — Prints (30 min)**

1. Com a Central pronta, tire os prints seguindo o `04-roteiro-prints.md`.
2. Salve em `img/ajuda/` com os nomes indicados.
3. Até lá, a Central mostra uma caixa "Imagem em preparação" no lugar de cada print, então ela já funciona sem as imagens.

**Etapa 4 — Testar com o público**

Use o roteiro de teste no final do `05-checklist-validacao.md` com as 2 cuidadoras e a paciente.

---

## Dicas para usar o Claude Code

- **Faça uma cópia do HTML antes de começar** (o prompt também pede que o Claude Code faça um backup).
- Se a resposta dele parecer confusa, peça: "explique em linguagem simples o que você mudou".
- Se algo quebrar, peça: "volte para o backup e tente de novo só a fase X".
- Se o projeto estiver no GitHub, ao final peça: "faça um commit com a mensagem: feat: adiciona Central de Ajuda (FAQ)".
