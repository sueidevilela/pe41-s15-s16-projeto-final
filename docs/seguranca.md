# Segurança do CUIDAR

> "A tela é a porta; o banco é a fechadura."
> O CUIDAR é um protótipo acadêmico com **dados fictícios**. Mesmo assim, tratamos tudo como
> dado de saúde, que é dado sensível pela LGPD.

Última atualização: 17/11/2026 — v7 (validada no ambiente de testes; RLS aplicado no projeto principal; teste automático: 30 OK, 0 falhas).

---

## 1. O que foi implementado

| Frente | O que existe hoje |
|---|---|
| **Segredos fora do código** | Nenhuma chave secreta no código. `.env` ignorado pelo git. Verificador de segredos roda antes de cada commit e bloqueia se achar uma chave. |
| **Login (a porta)** | Login com e-mail e senha (Supabase Auth). Sem cadastro público. Tela com letra grande, rótulos visíveis e botão "Mostrar senha". Erro sempre genérico: "E-mail ou senha incorretos." Toda página interna confere o login antes de aparecer. Botão "Sair" em todas as páginas. |
| **RLS (a fechadura)** | Todas as tabelas com RLS ligado e regras por pessoa. Sem login, o banco responde "permissão negada". |
| **Custo** | **Custo de IA = zero.** O Tradutor funciona em modo biblioteca, sem chamar IA. Supabase e Vercel nos planos gratuitos. |
| **Tradutor da Saúde** | Roda dentro da página (só para quem está logada). Recusa texto vazio, texto com mais de 3.000 letras e texto com CPF, cartão do SUS, telefone ou e-mail. Resposta sempre de um verbete **revisado e com fonte**. Aviso fixo: "O Tradutor da Saúde explica termos. Ele não substitui sua equipe de saúde." |
| **Privacidade das perguntas** | A pergunta do Tradutor não sai do navegador e não é guardada. O log do servidor local só guarda tamanho, status e verbetes usados. |
| **Texto na tela** | Texto que vem da usuária ou da biblioteca é mostrado com `textContent`, nunca como código. |

---

## 2. Onde cada segredo vive

| Segredo | Onde fica | Pode ir para o navegador? | Pode ir para o GitHub? |
|---|---|---|---|
| URL do Supabase | `js/config.js` | ✅ sim (é pública) | ✅ sim |
| Chave **publicável** do Supabase (`sb_publishable_…`) | `js/config.js` | ✅ sim (é pública; quem protege é o RLS) | ✅ sim |
| Chave **secreta** do Supabase (`sb_secret_…`) | Só na conexão do **Make** (quando existir) | ❌ nunca | ❌ nunca |
| Chave da Anthropic | **Não é usada.** (Se existir, só no `.env` local da v6.) | ❌ nunca | ❌ nunca |
| Senhas das contas de teste A, B e C | Só com a Sueide e no `.env` local (para o teste automático) | ❌ nunca | ❌ nunca |
| Senha do banco Postgres | Só com a Sueide | ❌ nunca | ❌ nunca |

Se uma chave vazar: siga `docs/03-SE-UMA-CHAVE-VAZAR.md`.

---

## 3. As regras do banco (RLS), em português simples

**A regra:** você vê os dados de uma paciente se você **é** essa paciente, ou se você é a **cuidadora ligada a ela**. Ninguém mais. Sem login: nada.

| Tabela | Paciente | Cuidadora | Outra pessoa logada | Sem login |
|---|---|---|---|---|
| `pacientes` | vê a própria ficha | vê a ficha da paciente de quem cuida | nada | nada |
| `cuidadores` | vê a ficha da sua cuidadora | vê a própria ficha | nada | nada |
| `consultas` | vê, cria, altera e apaga as suas | vê, cria, altera e apaga as da paciente | nada | nada |
| `atividades_bem_estar` | igual às consultas | igual às consultas | nada | nada |
| `lembretes_enviados` | só vê os seus | só vê os da paciente | nada | nada |

- **Fichas de pessoas** (pacientes e cuidadoras) só são criadas ou alteradas pela responsável, no painel do Supabase.
- **Lembretes** só são gravados pela automação (Make), com a chave secreta.
- As funções que respondem "esta pessoa pode ver esta paciente?" ficam num schema escondido da API (`privado`).
- Arquivo: `supabase/migrations/20261117000000_rls_paciente_cuidadora.sql`.

---

## 4. Limites de uso e de custo

| Onde | Limite | Por quê |
|---|---|---|
| Tradutor | Máximo de **3.000 letras** por pergunta | Texto gigante não é "um termo"; evita travar a página. |
| Tradutor | **Sem IA** | Custo zero, garantido. |
| Login | Limite de tentativas do próprio Supabase Auth | Dificulta quem tenta adivinhar senhas. |
| Lembretes por e-mail (Make) | **No máximo 5 por pessoa por dia** | Evita spam e gasto de operações do Make. |
| Supabase | Plano gratuito: no plano Free o Supabase **não cobra** excedente; ele restringe o serviço | Sem fatura surpresa. |
| Vercel | Plano Hobby (gratuito) | Sem cartão, sem cobrança. |

---

## 5. Regras para a automação de lembretes por e-mail (Make)

> A automação **ainda não existe**. Estas são as regras para montá-la com segurança.
> Ordem: montar e testar no projeto **cuidar-teste** → só depois ligar ao projeto principal.

1. **Chave secreta só no Make.** A chave `sb_secret_…` do Supabase vai **somente** na conexão do Make
   (campo de credencial). Nunca em código, planilha, print ou chat. Ela passa por cima do RLS:
   trate como a chave da casa.
2. **E-mail sem detalhe de saúde.** O texto não pode ter especialidade, exame, remédio, diagnóstico
   ou orientação. Modelo:
   > **Assunto:** Lembrete do CUIDAR
   > **Texto:** Olá! Você tem um compromisso amanhã. Abra o CUIDAR para ver os detalhes.
   > Em emergência, ligue para o SAMU: 192.
3. **Só para quem aceitou.** Enviar apenas para pacientes com `recebe_lembretes = true`.
4. **No máximo 5 e-mails por pessoa por dia.** Antes de enviar, contar em `lembretes_enviados`
   quantos e-mails aquela paciente recebeu nas últimas 24 horas. Se já forem 5, não envia.
5. **Registrar cada envio** em `lembretes_enviados` (paciente, tipo, canal `email`, status), e no
   campo `conteudo` guardar **só o texto genérico** acima.
6. **Envios de teste só para o SEU e-mail.** No `cuidar-teste`, troque o e-mail da "Paciente
   Teste A" pelo seu próprio e-mail para ver o lembrete chegar. Nunca use e-mail de outra pessoa.
   **Nunca envie para os e-mails fictícios das fichas** (ex.: `@exemplo.com`): esse domínio pode
   existir e pertencer a alguém. Para endereços inventados, prefira `@example.com`, que é
   reservado e nunca entrega mensagens.
   O Make **não usa contas de login**: ele lê o campo `email` da tabela `pacientes` com a chave
   secreta. Contas de login servem só para as pessoas entrarem no app.
7. **Rodar no máximo uma vez por dia** (por exemplo, às 8h), para gastar poucas operações do plano
   gratuito do Make.
8. **Erro não mostra dados.** Se o envio falhar, registrar só `status = 'erro'`, sem copiar o
   e-mail ou o conteúdo para o histórico de erros.

---

## 6. Backlog (o que ficou para depois, e por quê)

| Item | Por que ficou para depois |
|---|---|
| Automação de lembretes no Make | Decisão da Sueide: montar depois da v7, seguindo a seção 5. |
| Mais de uma cuidadora por paciente | Exige uma tabela nova; o protótipo usa uma cuidadora por paciente. |
| Integridade (SRI) do script do Supabase vindo da CDN | Precisa baixar e conferir o arquivo; a versão já está fixa (2.45.4). |
| Política de segurança de conteúdo (CSP) | A página tem scripts dentro do HTML; exige reorganizar o código. |
| Remover a rota antiga `/api/tradutor` do servidor local | A página não usa mais; só existe no computador local, não vai para a Vercel. |
| Ligar a IA no Tradutor | Só se houver orçamento. Nesse caso: edge function, rate limit (tabela `uso_tradutor`), `max_tokens` baixo e teto de gasto no console da Anthropic. |
| Página para a paciente ver e editar dados do banco | O app ainda mostra dados de demonstração; o banco já está pronto e protegido para isso. |
