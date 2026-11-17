# Checklist de validação — Central de Ajuda do CUIDAR

## Parte 1 — Conferência técnica (você, 15 min)

Abra o `cuidar_prototipo.html` no navegador e marque:

**Acesso**
- [ ] O item **❓ Central de Ajuda** aparece no menu, no grupo "Ajuda".
- [ ] Ao tocar, a página abre e o título no topo muda para "Central de Ajuda".
- [ ] O botão **Acessar ajuda →** do cartão no rodapé do menu também abre a Central.

**Conteúdo**
- [ ] Aparecem as **9 categorias** e as **32 perguntas**.
- [ ] Os textos estão iguais aos do `02-faq-conteudo.json` (confira 3 ou 4 por amostra).
- [ ] O bloco final "Ainda precisa de ajuda?" aparece com o aviso do **SAMU 192**.

**Funcionamento**
- [ ] Ao tocar numa pergunta, a resposta abre; ao tocar em outra, a primeira fecha.
- [ ] A busca encontra: `voce` · `exame` · `samu` · `letra pequena` · `cpf`.
- [ ] Uma busca como `xyzabc` mostra a mensagem gentil de "não encontramos".
- [ ] As categorias filtram as perguntas; "Todas" volta a mostrar tudo.
- [ ] **Ir para esta tela** leva à página certa (teste 5 perguntas diferentes).
- [ ] **Esta resposta ajudou?** mostra o agradecimento.
- [ ] Sem imagens na pasta, aparece "Imagem em preparação" no lugar dos prints.
- [ ] Com uma imagem na pasta `img/ajuda/`, ela aparece no lugar certo.

**Acessibilidade**
- [ ] **A+ / A−** mudam o tamanho da letra; ao recarregar a página, o tamanho continua.
- [ ] **🔊 Ouvir resposta** lê em português; o botão vira "⏹ Parar leitura"; para ao trocar de pergunta.
- [ ] Dá para usar tudo só com o teclado (Tab e Enter), e o contorno de foco aparece bem.
- [ ] Letra das respostas confortável de ler a um braço de distância.

**Celular** (F12 → Ctrl + Shift + M → iPhone 12 Pro)
- [ ] O botão ☰ abre o menu e a Central.
- [ ] Nada corta nas laterais, sem rolagem para os lados.
- [ ] Categorias em 2 colunas; botões fáceis de tocar.

**Não quebrou nada**
- [ ] As outras 8 telas abrem e funcionam como antes.
- [ ] F12 → aba **Console**: nenhuma mensagem vermelha de erro.

---

## Parte 2 — Teste com o público (cuidadoras e paciente)

**Antes:** explique que é um teste do aplicativo, não da pessoa. Não existe erro. Peça para ela falar em voz alta o que está pensando. Não ajude, a não ser que ela peça ou fique travada por mais de 1 minuto.

**Tarefas** (leia uma de cada vez):

| # | Tarefa para a pessoa | Ela conseguiu? | Tempo | Precisou de ajuda? | Observações |
|---|---|---|---|---|---|
| 1 | "Você ficou com dúvida sobre o aplicativo. Encontre onde pedir ajuda." | ☐ Sim ☐ Não | | | |
| 2 | "Descubra como colocar um exame no CUIDAR." | ☐ Sim ☐ Não | | | |
| 3 | "Seu exame está só no papel. Descubra se dá para colocar no aplicativo." | ☐ Sim ☐ Não | | | |
| 4 | "A letra está pequena para você. Deixe maior." | ☐ Sim ☐ Não | | | |
| 5 | "Peça para o aplicativo ler uma resposta em voz alta." | ☐ Sim ☐ Não | | | |
| 6 | "Descubra o que fazer se você passar mal de repente." | ☐ Sim ☐ Não | | | |
| 7 | "Encontre o que é cuidado paliativo." | ☐ Sim ☐ Não | | | |

**Perguntas no final** (respostas de 1 a 5, de "muito difícil" a "muito fácil"):

1. Foi fácil encontrar a Central de Ajuda? ☐1 ☐2 ☐3 ☐4 ☐5
2. As respostas foram fáceis de entender? ☐1 ☐2 ☐3 ☐4 ☐5
3. A letra e as imagens ficaram confortáveis de ver? ☐1 ☐2 ☐3 ☐4 ☐5
4. O botão de ouvir a resposta foi útil? ☐1 ☐2 ☐3 ☐4 ☐5
5. Teve alguma dúvida que **não** encontrou na Central? Qual? ______________________
6. O que você mudaria? ______________________

**Depois do teste:** as dúvidas que faltaram viram perguntas novas no `02-faq-conteudo.json` (peça ao Claude Code com o prompt 3 do arquivo `06-prompts-de-ajuste.md`).
