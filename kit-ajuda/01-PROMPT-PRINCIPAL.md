# Prompt principal — implementar a Central de Ajuda no CUIDAR

**Como usar:** copie tudo o que está entre as linhas `====== INÍCIO DO PROMPT ======` e `====== FIM DO PROMPT ======` e cole no Claude Code, aberto na pasta do projeto.

> **Por que o prompt é assim (técnicas usadas):**
> - **Papel definido**: o Claude Code atua como dev front-end especialista em acessibilidade para idosos.
> - **Contexto antes da tarefa**: o que é o CUIDAR, quem usa, o que já existe.
> - **Fontes de verdade em arquivos**: textos, regras e prints ficam no kit, e o prompt aponta para eles. Assim o Claude Code não inventa conteúdo.
> - **Restrições explícitas**: o que pode e o que não pode mudar.
> - **Trabalho em fases com pausas**: plano primeiro, aprovação, depois uma fase por vez.
> - **Critérios de aceite verificáveis**: ele confere o próprio trabalho antes de dizer que terminou.
> - **Formato de resposta definido**: relatório curto e em português simples.

---

```
====== INÍCIO DO PROMPT ======

<papel>
Você é um desenvolvedor front-end sênior, especialista em acessibilidade digital
para pessoas idosas e em interfaces de saúde. Você escreve código simples,
legível e bem comentado em português, porque quem vai manter o projeto está
aprendendo a programar.
</papel>

<contexto>
O CUIDAR é um protótipo acadêmico (projeto final de curso) de um sistema de
gestão da jornada de saúde hepática. Ele organiza documentos, exames,
consultas, equipe de cuidado e informações sobre cuidados paliativos, com
algumas funções de IA de apoio (como o Tradutor da Saúde).

- É um protótipo FICTÍCIO: não haverá dados reais de pacientes nem servidor.
- Todo o app está em UM arquivo: cuidar_prototipo.html (HTML + CSS + JS juntos).
- A navegação funciona com <section class="page" id="..."> e a função
  showPage(id). Os títulos ficam no objeto `titles` do <script>.
- O menu esquerdo (<aside class="sidebar">) tem dois grupos: "Meu espaço" e
  "Apoio e informação". No rodapé do menu há um cartão "Precisa de ajuda?" com
  o botão "Acessar ajuda →", que hoje só mostra um toast demonstrativo.
- O público principal são PESSOAS IDOSAS (senhores e senhoras), muitas com
  pouca familiaridade com tecnologia e visão reduzida, muitas vezes com apoio
  de um familiar ou cuidador. A maioria vai usar pelo celular.
</contexto>

<tarefa>
Implementar uma nova página "Central de Ajuda" (FAQ) dentro do
cuidar_prototipo.html, acessível pelo menu esquerdo, com perguntas frequentes,
respostas passo a passo e espaço para prints de tela.
</tarefa>

<fontes_de_verdade>
Leia estes arquivos ANTES de planejar. Eles mandam no conteúdo:
1. kit-ajuda/02-faq-conteudo.json → TODAS as categorias, perguntas, respostas,
   passos, dicas, alertas, prints e destino do botão "Ir para esta tela".
   Use os textos exatamente como estão. Não reescreva, não resuma, não invente
   perguntas novas.
2. kit-ajuda/03-acessibilidade.md → regras obrigatórias de acessibilidade.
3. kit-ajuda/04-roteiro-prints.md → nomes e caminhos das imagens.
4. cuidar_prototipo.html → leia o arquivo inteiro para entender o padrão
   visual (variáveis CSS em :root, classes .card, .feature-hero, .primary,
   .notice etc.) e a lógica de navegação.
</fontes_de_verdade>

<requisitos>
MENU E ACESSO
- Adicione no menu esquerdo um terceiro grupo, com o rótulo "Ajuda", contendo o
  botão "❓ Central de Ajuda" com data-page="ajuda", seguindo o mesmo padrão
  dos outros botões do menu.
- Faça o botão "Acessar ajuda →" do cartão do rodapé chamar showPage('ajuda').
- Adicione ajuda:'Central de Ajuda' ao objeto `titles`.

ESTRUTURA DA PÁGINA (de cima para baixo)
1. Bloco de abertura no padrão .feature-hero: eyebrow "ESTAMOS AQUI PARA
   AJUDAR", título "Central de Ajuda" e o texto de boas-vindas do JSON.
2. Barra de ferramentas de leitura: botões "A−" e "A+" (tamanho da letra da
   Central) com rótulo visível "Tamanho da letra".
3. Campo de busca grande, com <label> visível. A busca filtra as perguntas
   enquanto a pessoa digita, ignorando maiúsculas e acentos ("voce" encontra
   "você"), procurando na pergunta, na resposta e nas palavrasChave. Se nada
   for encontrado, mostre uma mensagem gentil do JSON
   (mensagens.buscaSemResultado) e o atalho para falar com a equipe.
4. Botões de categoria (cartões grandes com ícone + nome). Ao tocar, mostram só
   as perguntas daquela categoria. Inclua o botão "Todas".
5. Lista de perguntas em acordeão:
   - Use <button> com aria-expanded e aria-controls (não use só <div>).
   - Apenas UMA resposta aberta por vez.
   - Ao abrir, role suavemente até a pergunta.
6. Dentro de cada resposta, nesta ordem, mostrando só o que existir no JSON:
   resumo → passos numerados (<ol>) → lista de itens (<ul>) → dica → alerta →
   print → botões de ação.
   - Print: <figure> com <img> (src = caminho do JSON, alt = descrição do JSON,
     loading="lazy") e <figcaption>. Se a imagem não existir (evento onerror),
     troque por uma caixa tracejada com o texto "🖼️ Imagem em preparação" e a
     descrição do print. A página precisa funcionar sem nenhuma imagem.
   - Alerta de emergência (tipo "emergencia"): caixa vermelha clara, letra
     grande, com "SAMU 192" em destaque.
   - Botões de ação: "Ir para esta tela" (chama showPage com o valor de
     irPara, só se existir), "🔊 Ouvir resposta" e
     "Esta resposta ajudou? 👍 Sim / 👎 Não". Ao responder, mostre
     "Obrigado! Sua opinião ajuda a melhorar o CUIDAR." (sem enviar nada).
7. Bloco final "Ainda precisa de ajuda?" com o conteúdo do JSON: botão para a
   Equipe de cuidado, orientação para pedir ajuda a um familiar e aviso de
   emergência SAMU 192.

FUNÇÕES
- "Ouvir resposta": use window.speechSynthesis com lang 'pt-BR', velocidade
  0.9. Ler o título da pergunta + resumo + passos + dica (sem emojis). Enquanto
  lê, o botão vira "⏹ Parar leitura". Ao trocar de pergunta ou de página, pare
  a leitura. Se o navegador não suportar, esconda o botão.
- Tamanho da letra: 3 níveis (normal, grande, muito grande), aplicados só à
  Central de Ajuda, por exemplo com uma classe no <section id="ajuda">. Salve a
  escolha em localStorage dentro de try/catch (se falhar, só não salva).
- Os dados da FAQ devem ficar num objeto JavaScript `FAQ_DATA` dentro do HTML,
  copiado do 02-faq-conteudo.json (o arquivo precisa abrir com duplo clique,
  sem servidor, então NÃO use fetch). Deixe um comentário indicando que a
  fonte é o kit-ajuda/02-faq-conteudo.json.
- A página é montada por uma função renderizarAjuda() que lê FAQ_DATA.
  Escapar textos ao inserir no HTML (ou usar textContent).
</requisitos>

<restricoes>
- NÃO altere o conteúdo nem o comportamento das outras páginas. Só pode mexer
  nelas o necessário para o menu, o objeto titles e o botão do cartão de ajuda.
- NÃO use bibliotecas, frameworks, CDNs ou fontes externas. Só HTML, CSS e
  JavaScript puros, num arquivo só.
- NÃO invente textos médicos nem promessas sobre o serviço. Use só o JSON.
- Reaproveite as variáveis de cor do :root e o estilo visual existente. Classes
  novas devem começar com "ajuda-" para não colidir com as atuais.
- Antes de editar, crie um backup: cuidar_prototipo.backup-antes-ajuda.html.
- Se encontrar algo ambíguo ou conflitante entre o JSON e o HTML, PARE e me
  pergunte, em vez de decidir sozinho.
</restricoes>

<forma_de_trabalho>
Trabalhe em fases. Ao final de cada fase, PARE, me mostre um resumo curto e
espere eu dizer "pode seguir".

FASE 0 — Plano (sem editar nada)
  Leia os arquivos, depois me mostre: o que vai mudar no HTML (lista curta),
  onde cada parte vai entrar, e qualquer dúvida ou conflito encontrado.

FASE 1 — Estrutura
  Backup, item no menu, botão do cartão, titles, <section id="ajuda">,
  FAQ_DATA e renderização das categorias, perguntas e respostas (acordeão).

FASE 2 — Interações
  Busca, filtro por categoria, "Ir para esta tela", "Esta resposta ajudou?",
  fallback das imagens, bloco "Ainda precisa de ajuda?".

FASE 3 — Acessibilidade
  A+/A−, "Ouvir resposta", foco visível, navegação por teclado, revisão
  completa contra o 03-acessibilidade.md, versão celular (até 390px).
</forma_de_trabalho>

<criterios_de_aceite>
Antes de dizer que terminou, confira e marque cada item:
[ ] O item "Central de Ajuda" aparece no menu e abre a página; o título no topo
    muda para "Central de Ajuda".
[ ] O botão "Acessar ajuda →" do cartão também abre a página.
[ ] Todas as perguntas do JSON aparecem, na ordem e com o texto exato
    (informe o total encontrado: o JSON tem 32 perguntas em 9 categorias).
[ ] Só uma resposta abre por vez; aria-expanded muda corretamente.
[ ] A busca encontra "voce", "exame", "samu" e "letra pequena"; uma busca sem
    resultado mostra a mensagem gentil.
[ ] Os filtros de categoria funcionam, incluindo "Todas".
[ ] "Ir para esta tela" leva à página certa em todas as perguntas que têm irPara.
[ ] Sem nenhuma imagem na pasta, cada print mostra "Imagem em preparação".
[ ] A+/A− mudam o tamanho e a escolha continua ao recarregar a página.
[ ] "Ouvir resposta" lê em português e para ao trocar de pergunta.
[ ] No celular (390px): menu ☰ abre a Central, nada corta na lateral,
    botões com pelo menos 48px de altura.
[ ] Letra das respostas com pelo menos 18px e perguntas com pelo menos 20px
    no tamanho "normal".
[ ] Nenhum erro no console do navegador.
[ ] As outras 8 páginas continuam funcionando como antes.
</criterios_de_aceite>

<formato_da_resposta>
Responda sempre em português do Brasil, em linguagem simples (estou aprendendo).
Em cada pausa:
1. O que foi feito (até 5 tópicos).
2. Como eu confiro (o que abrir e onde clicar).
3. Dúvidas ou pontos de atenção, se houver.
No final da FASE 3, inclua a lista de critérios de aceite marcada e uma
sugestão de mensagem de commit.
</formato_da_resposta>

Comece pela FASE 0.

====== FIM DO PROMPT ======
```
