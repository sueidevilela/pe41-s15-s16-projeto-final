-- =====================================================================
-- CUIDAR — Modelo de RLS (Row Level Security)
-- Modelo para o Claude Code adaptar aos nomes reais das tabelas.
-- Executar no Supabase: SQL Editor → colar → Run.
-- "A tela é a porta; o banco é a fechadura."
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABELAS COM DADOS POR PESSOA
-- Repetir este bloco para cada tabela: jornadas, consultas, exames,
-- medicamentos, lembretes etc. Troque NOME_DA_TABELA.
-- ---------------------------------------------------------------------

-- 1a. Garante a coluna de dona do registro
alter table public.NOME_DA_TABELA
  add column if not exists user_id uuid
  not null default auth.uid()
  references auth.users(id) on delete cascade;

-- (Se a tabela já tem linhas sem dona, o "not null" acima falha.
--  Nesse caso: criar a coluna sem "not null", preencher as linhas
--  fictícias com o id de uma conta de teste e depois aplicar o not null.)

create index if not exists NOME_DA_TABELA_user_id_idx
  on public.NOME_DA_TABELA (user_id);

-- 1b. Liga a fechadura
alter table public.NOME_DA_TABELA enable row level security;

-- 1c. Cada pessoa só vê, cria, altera e apaga o que é dela
create policy "NOME_DA_TABELA: ver os próprios"
  on public.NOME_DA_TABELA for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "NOME_DA_TABELA: criar para si"
  on public.NOME_DA_TABELA for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "NOME_DA_TABELA: alterar os próprios"
  on public.NOME_DA_TABELA for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "NOME_DA_TABELA: apagar os próprios"
  on public.NOME_DA_TABELA for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 1d. Quem não está logada não chega nem perto
revoke all on public.NOME_DA_TABELA from anon;


-- ---------------------------------------------------------------------
-- 2. BIBLIOTECA DO TRADUTOR (base de RAG — a base de dados do edital)
-- Conteúdo de referência higienizado, sem dados de pessoas.
-- Logadas só leem. Ninguém escreve pelo app: a carga é feita por
-- script com a chave secreta, fora do navegador.
-- ---------------------------------------------------------------------

create table if not exists public.biblioteca_tradutor (
  id           bigint generated always as identity primary key,
  titulo       text not null,
  fonte        text not null,          -- ex.: "Manual de Transplante Hepático (USP, 2024)"
  conteudo     text not null,
  criado_em    timestamptz not null default now()
);

alter table public.biblioteca_tradutor enable row level security;

create policy "biblioteca: logadas leem"
  on public.biblioteca_tradutor for select
  to authenticated
  using (true);

-- Sem políticas de insert/update/delete = ninguém escreve pelo app.
revoke all on public.biblioteca_tradutor from anon;


-- ---------------------------------------------------------------------
-- 3. REGISTRO DE USO DO TRADUTOR (para o rate limit)
-- RLS ligado e NENHUMA política: o navegador não lê nem escreve.
-- Só a edge function, com a chave secreta, acessa.
-- Nunca guardar aqui o texto de saúde enviado.
-- ---------------------------------------------------------------------

create table if not exists public.uso_tradutor (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  criado_em    timestamptz not null default now(),
  tamanho      integer not null,       -- só o tamanho do texto, nunca o texto
  status       integer not null        -- 200, 400, 429, 500...
);

create index if not exists uso_tradutor_user_tempo_idx
  on public.uso_tradutor (user_id, criado_em desc);

alter table public.uso_tradutor enable row level security;
revoke all on public.uso_tradutor from anon, authenticated;

-- Consulta que a edge function usa para o rate limit (referência):
--   select count(*) from uso_tradutor
--   where user_id = $1 and criado_em > now() - interval '1 minute';   -- limite 10
--   select count(*) from uso_tradutor
--   where user_id = $1 and criado_em > now() - interval '1 day';      -- limite 60


-- ---------------------------------------------------------------------
-- 4. CONFERÊNCIA FINAL — nenhuma tabela pode ficar sem fechadura
-- Resultado esperado: rls_ativo = true em TODAS as linhas.
-- ---------------------------------------------------------------------

select
  c.relname                         as tabela,
  c.relrowsecurity                  as rls_ativo,
  count(p.policyname)               as qtd_politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;
