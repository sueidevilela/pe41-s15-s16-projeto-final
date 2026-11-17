# Prompts de ajuste — para depois da implementação

Prompts curtos para colar no Claude Code nas etapas seguintes. Use **um de cada vez**.

---

## 1. Corrigir algo que não passou no checklist

```
Na Central de Ajuda do cuidar_prototipo.html, este item do checklist não
funcionou: [DESCREVA O QUE ACONTECEU, ex.: "a busca por 'voce' não encontra
nada"].
O esperado era: [O QUE DEVERIA ACONTECER].
Encontre a causa, me explique em uma frase simples e corrija sem mexer no
resto. Depois me diga como eu confiro.
```

## 2. Conferir os prints depois de colocar as imagens

```
Coloquei os prints em img/ajuda/. Confira se todos os 13 arquivos listados
em kit-ajuda/04-roteiro-prints.md existem com o nome exato e se cada um
aparece na pergunta certa da Central de Ajuda. Me mostre uma tabela:
arquivo | encontrado (sim/não) | pergunta onde aparece.
Não altere nada; só verifique e me diga se falta algum.
```

## 3. Adicionar uma pergunta nova (ex.: dúvida que surgiu nos testes)

```
Adicione uma pergunta nova à Central de Ajuda.
- Categoria: [ex.: documentos]
- Pergunta: [texto]
- Resposta: [texto ou passos]
- Print: [nome do arquivo, ou "sem print"]
- Ir para a tela: [id da página, ou "nenhuma"]
Siga o mesmo formato das outras perguntas. Atualize primeiro o
kit-ajuda/02-faq-conteudo.json e depois o FAQ_DATA dentro do HTML, para os
dois ficarem iguais. Escreva no mesmo tom simples das outras respostas e
crie 4 a 6 palavrasChave sem acento.
```

## 4. Aumentar a letra do aplicativo inteiro (recomendado)

O protótipo usa letras de 9 a 12px em várias telas, pequenas demais para o público idoso.

```
Leia kit-ajuda/03-acessibilidade.md. Agora aplique as regras de tamanho de
letra, contraste e área de toque ao RESTO do cuidar_prototipo.html (todas as
páginas, não só a Central de Ajuda).
- Texto comum: mínimo 16px; textos de apoio (small, .notice): mínimo 14px;
  títulos proporcionais.
- Botões e itens do menu: mínimo 48px de altura.
- Troque cores de texto com contraste abaixo de 4,5:1.
Antes de editar, faça backup em cuidar_prototipo.backup-antes-fonte.html e me
mostre um plano curto. Mantenha o visual e as cores do CUIDAR. Confira a
versão celular (390px) no final.
```

## 5. Ligar o botão "?" flutuante (opcional)

```
Adicione ao cuidar_prototipo.html um botão redondo fixo no canto inferior
direito, visível em todas as páginas menos na própria Central de Ajuda, com
"?" e o texto "Ajuda" embaixo. Ao tocar, abre a Central de Ajuda.
Tamanho mínimo 56px, cor --blue, contraste AA, não pode cobrir o toast nem
botões importantes no celular (390px).
```

## 6. Documentar no GitHub

```
Atualize (ou crie) o README.md do projeto com uma seção "Central de Ajuda"
explicando em português simples: o que é, como acessar, onde ficam os textos
(kit-ajuda/02-faq-conteudo.json e FAQ_DATA no HTML), como adicionar uma
pergunta e como trocar um print. Depois faça um commit com a mensagem:
"docs: documenta a Central de Ajuda (FAQ)".
```

## 7. Explicar o código (para o pitch ou para estudar)

```
Explique em linguagem simples, como para uma iniciante em programação, como
funciona o código da Central de Ajuda: onde ficam os dados, como a página é
montada, como funcionam a busca, o acordeão, o A+/A− e o "Ouvir resposta".
Use no máximo 10 tópicos e cite o nome das funções.
```
