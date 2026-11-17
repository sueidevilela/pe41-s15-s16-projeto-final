# CHANGELOG — CUIDAR

## v7 — camada de segurança (17/11/2026)

Criada a partir da v6. Tudo foi construído e testado antes num ambiente de testes separado,
com um projeto Supabase só para testes e contas fictícias. A v6 continua guardada, sem mudanças.

### O que mudou, em linguagem simples

**Login (a porta)**
- Agora é preciso entrar com e-mail e senha para ver o CUIDAR. Não há cadastro público:
  as contas são criadas pela responsável no painel do Supabase.
- Tela de entrada nova, pensada para pessoas idosas: letra grande, campos e botões grandes,
  rótulos sempre visíveis e botão "Mostrar senha".
- Se o e-mail ou a senha estiverem errados, a mensagem é sempre a mesma:
  "E-mail ou senha incorretos." (não ajuda quem tenta adivinhar contas).
- Botão "Sair" no topo de todas as páginas.

**Banco de dados (a fechadura)**
- Cada pessoa só vê os dados da própria paciente: a paciente vê os seus; a cuidadora vê os da
  paciente de quem cuida; ninguém mais. Sem login, o banco responde "permissão negada".
- Fichas de pacientes e cuidadoras só são criadas e alteradas pela responsável, no painel.
- A cuidadora agora pode ser ligada a uma conta de login.

**Tradutor da Saúde**
- Custo zero: funciona em modo biblioteca, sem chamar IA. A resposta é sempre um verbete
  revisado, com fonte.
- A pergunta não sai do navegador e não é guardada em lugar nenhum.
- Aviso fixo na tela: "O Tradutor da Saúde explica termos. Ele não substitui sua equipe de saúde."
- Recusa texto vazio, texto com mais de 3.000 letras e texto com CPF, cartão do SUS, telefone ou e-mail.
- Novas proteções: sintomas de urgência (como febre depois do transplante) mostram o alerta para
  ligar para a equipe ou o SAMU (192); perguntas sobre dose de remédio e sobre chás não recebem
  orientação e são encaminhadas à equipe; mensagens de medo recebem acolhimento (e o CVV, 188).

**Segredos**
- Nenhuma chave secreta no código. No navegador, só a chave pública do Supabase (em `js/config.js`).
- Verificador de segredos (`scripts/checar-segredos.sh`) roda antes de cada commit.
- O registro do servidor local não guarda mais o texto das perguntas.

**Testes e documentação**
- Teste automático de segurança: `node scripts/testar-seguranca.mjs`.
- `docs/seguranca.md`: o que foi feito, onde mora cada segredo, as regras do banco e as regras para
  a futura automação de lembretes por e-mail (Make).
- `docs/02-CHECKLIST-VALIDACAO.md`: checklist preenchido com os resultados dos testes.

### O que não mudou
- Layout, textos e telas do CUIDAR continuam iguais à v6, exceto a tela de login, o botão "Sair"
  e os avisos do Tradutor.
- A biblioteca do Tradutor (`dados/biblioteca.json`) é a mesma.
