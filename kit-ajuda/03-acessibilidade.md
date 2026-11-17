# Regras de acessibilidade — Central de Ajuda do CUIDAR

Público: **pessoas idosas**, muitas com pouca familiaridade com tecnologia, visão reduzida, tremor nas mãos ou dificuldade de memória, além de familiares e cuidadores. A maioria usará pelo **celular**.

Regras **obrigatórias** para o Claude Code. Base: WCAG 2.1 nível AA + boas práticas para o público idoso.

---

## 1. Texto e leitura

| Regra | Valor mínimo |
|---|---|
| Texto das respostas | **18px** no tamanho "normal" |
| Título das perguntas | **20px**, negrito |
| Títulos de seção | 24px ou mais |
| Altura da linha (line-height) | 1.6 |
| Largura máxima do texto | cerca de 70 caracteres por linha (max-width ~ 680px) |
| Níveis de A+/A− | normal (100%), grande (120%), muito grande (140%) |

- Fonte sem serifa (usar a que o app já usa).
- Nada de texto em CAIXA ALTA em frases longas (só nos rótulos curtos, como o eyebrow).
- Nada de texto em itálico para informação importante.
- Usar `rem` ou `em` para a letra crescer junto com o A+ e com o zoom do navegador.

## 2. Cor e contraste

- Contraste mínimo de **4,5:1** para texto normal e **3:1** para texto grande e ícones.
- Texto principal: usar `--navy` (#173d62) ou `--ink` (#20384d) sobre fundo branco ou `--sky`.
- **Não** usar `--muted` (#71869a) nem cinzas mais claros para texto das respostas.
- Nunca passar informação **só pela cor**: o alerta de emergência tem ícone + palavra "Emergência" + cor.
- Alerta de emergência: fundo vermelho bem claro (ex.: #fdecea), borda vermelha (#c62828), texto escuro.

## 3. Toque e botões

- Área de toque de **pelo menos 48 × 48 px** em todos os botões, perguntas e categorias.
- **Pelo menos 8px** de espaço entre elementos tocáveis.
- Botões com **texto visível**, não só ícone (ex.: "🔊 Ouvir resposta", nunca só "🔊").
- Cada pergunta do acordeão inteira é clicável, não só a setinha.
- Indicar claramente que a pergunta abre: sinal **+** quando fechada e **−** quando aberta, ao lado do texto.

## 4. Foco e teclado

- Tudo deve funcionar só com teclado: Tab para andar, Enter ou Espaço para abrir.
- **Foco visível e forte**: contorno de 3px em `--blue` com 2px de afastamento (`outline-offset`).
- Ao abrir uma resposta, o foco continua na pergunta (não pular para outro lugar).
- Ao clicar em "Ir para esta tela", rolar para o topo da nova página.

## 5. Leitores de tela e semântica

- Perguntas: `<button aria-expanded="false" aria-controls="resposta-ID">`.
- Respostas: `<div id="resposta-ID" role="region" aria-labelledby="pergunta-ID">`.
- Passos em `<ol>`, listas em `<ul>`, prints em `<figure>` + `<figcaption>`.
- Toda imagem com `alt` descritivo (usar a `descricao` do JSON).
- Campo de busca com `<label>` visível (não só placeholder).
- Resultado da busca anunciado com `aria-live="polite"` (ex.: "5 perguntas encontradas").
- Botões A+/A− com `aria-label` ("Aumentar letra", "Diminuir letra").

## 6. Linguagem

- Os textos vêm prontos do JSON: **não reescrever**.
- Textos de interface criados pelo Claude Code (rótulos, avisos) devem seguir o mesmo estilo:
  - frases curtas, voz ativa, "você";
  - "toque" em vez de "clique";
  - sem siglas, sem inglês, sem termos técnicos;
  - tom acolhedor e calmo, nunca alarmante (exceto no aviso de emergência, que é direto).

## 7. Movimento e tempo

- Animações curtas (até 200ms) e suaves. Nada piscando.
- Respeitar `@media (prefers-reduced-motion: reduce)`: desligar animações e rolagem suave.
- Nada some sozinho com pressa: mensagens de confirmação ficam visíveis até a pessoa seguir.

## 8. Celular

- Testar em **390px** de largura (iPhone comum) e 360px (Android comum).
- Sem rolagem para os lados.
- Categorias em **2 colunas** no celular; perguntas ocupam a largura toda.
- Prints com `max-width: 100%` e `height: auto`.

## 9. Ouvir resposta

- `speechSynthesis` com `lang = 'pt-BR'` e `rate = 0.9`.
- Escolher uma voz em português, se houver (`getVoices()` filtrando por `pt`).
- Remover emojis e símbolos do texto antes de ler.
- Um botão por resposta, que alterna entre "🔊 Ouvir resposta" e "⏹ Parar leitura".
- Parar a leitura ao fechar a resposta, abrir outra ou trocar de página.
