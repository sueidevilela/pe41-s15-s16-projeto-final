-- =====================================================================
-- CUIDAR · RLS — a fechadura do banco (Fase 4)
--
-- Já aplicada e testada no projeto de testes "cuidar-teste" (16/11/2026).
-- v7: rodar UMA vez no projeto principal "cuidar" (endereço com yqleyuvkzeoaidvvnpjn).
--
-- A regra, em português:
--   Você vê os dados de uma paciente se você É essa paciente,
--   ou se você é a CUIDADORA ligada a ela. Ninguém mais.
--   Sem login: nada.
--
-- O que cada pessoa logada pode fazer:
--   pacientes ............ ver (a própria ficha / a ficha de quem cuida). Não altera.
--   cuidadores ........... ver (a própria ficha / a cuidadora da paciente). Não altera.
--   consultas ............ ver, criar, alterar e apagar — só da paciente permitida.
--   atividades_bem_estar . ver, criar, alterar e apagar — só da paciente permitida.
--   lembretes_enviados ... só ver. Quem grava é a automação, com a chave secreta.
-- Cadastrar pacientes e cuidadoras e ligar às contas: só a responsável, pelo painel.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Ligar a cuidadora a uma conta de login
-- (a tabela pacientes já tem user_id; cuidadores ainda não tinha)
-- ---------------------------------------------------------------------
alter table public.cuidadores
  add column if not exists user_id uuid unique
  references auth.users(id) on delete set null;

comment on column public.cuidadores.user_id is
  'Conta de login da cuidadora (Supabase Auth). Vazia = cuidadora sem acesso ao app.';

-- Índices: deixam as regras rápidas
create index if not exists pacientes_user_id_idx            on public.pacientes (user_id);
create index if not exists pacientes_cuidador_id_idx        on public.pacientes (cuidador_id);
create index if not exists consultas_paciente_id_idx        on public.consultas (paciente_id);
create index if not exists atividades_paciente_id_idx       on public.atividades_bem_estar (paciente_id);
create index if not exists lembretes_paciente_id_idx        on public.lembretes_enviados (paciente_id);


-- ---------------------------------------------------------------------
-- 2. Funções de apoio, num schema "privado" que NÃO aparece na API
-- (security definer: consultam as tabelas sem cair em laço de RLS;
--  só respondem sobre a própria pessoa logada)
-- ---------------------------------------------------------------------
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

-- Qual é a ficha de cuidadora da pessoa logada? (ou nulo)
create or replace function privado.meu_cuidador_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.cuidadores c
  where c.user_id = (select auth.uid())
$$;

-- A pessoa logada pode ver esta paciente? (é ela, ou é a cuidadora dela)
create or replace function privado.pode_ver_paciente(p_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pacientes p
    where p.id = p_paciente_id
      and (
        p.user_id = (select auth.uid())
        or p.cuidador_id = (
          select c.id from public.cuidadores c where c.user_id = (select auth.uid())
        )
      )
  )
$$;

revoke all on function privado.meu_cuidador_id()        from public, anon;
revoke all on function privado.pode_ver_paciente(uuid)  from public, anon;
grant execute on function privado.meu_cuidador_id()       to authenticated;
grant execute on function privado.pode_ver_paciente(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Garante a fechadura ligada (já estava; repetir não faz mal)
-- ---------------------------------------------------------------------
alter table public.pacientes            enable row level security;
alter table public.cuidadores           enable row level security;
alter table public.consultas            enable row level security;
alter table public.atividades_bem_estar enable row level security;
alter table public.lembretes_enviados   enable row level security;


-- ---------------------------------------------------------------------
-- 4. Políticas (as "chaves" certas para cada pessoa)
-- ---------------------------------------------------------------------

-- 4a. pacientes: só ver
create policy "pacientes: ver a própria ficha ou a de quem cuido"
  on public.pacientes for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or cuidador_id = (select privado.meu_cuidador_id())
  );

-- 4b. cuidadores: só ver
create policy "cuidadores: ver a própria ficha ou a da minha cuidadora"
  on public.cuidadores for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or id in (
      select p.cuidador_id from public.pacientes p
      where p.user_id = (select auth.uid())
    )
  );

-- 4c. consultas: ver, criar, alterar, apagar — só da paciente permitida
create policy "consultas: ver da paciente permitida"
  on public.consultas for select
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));

create policy "consultas: criar para a paciente permitida"
  on public.consultas for insert
  to authenticated
  with check (privado.pode_ver_paciente(paciente_id));

create policy "consultas: alterar da paciente permitida"
  on public.consultas for update
  to authenticated
  using (privado.pode_ver_paciente(paciente_id))
  with check (privado.pode_ver_paciente(paciente_id));

create policy "consultas: apagar da paciente permitida"
  on public.consultas for delete
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));

-- 4d. atividades_bem_estar: igual às consultas
create policy "atividades: ver da paciente permitida"
  on public.atividades_bem_estar for select
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));

create policy "atividades: criar para a paciente permitida"
  on public.atividades_bem_estar for insert
  to authenticated
  with check (privado.pode_ver_paciente(paciente_id));

create policy "atividades: alterar da paciente permitida"
  on public.atividades_bem_estar for update
  to authenticated
  using (privado.pode_ver_paciente(paciente_id))
  with check (privado.pode_ver_paciente(paciente_id));

create policy "atividades: apagar da paciente permitida"
  on public.atividades_bem_estar for delete
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));

-- 4e. lembretes_enviados: só ver (a automação grava com a chave secreta)
create policy "lembretes: ver da paciente permitida"
  on public.lembretes_enviados for select
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));


-- ---------------------------------------------------------------------
-- 5. Permissões de base (camada extra, além do RLS)
-- ---------------------------------------------------------------------

-- Quem não está logada (papel "anon") não chega nem perto dos dados pessoais
revoke all on public.pacientes, public.cuidadores, public.consultas,
              public.atividades_bem_estar, public.lembretes_enviados
  from anon;

-- Tabelas criadas no futuro também nascem fechadas para "anon"
alter default privileges in schema public revoke all on tables from anon;

-- Logadas: nada de alterar fichas de pessoas nem lembretes pelo app
revoke insert, update, delete on public.pacientes, public.cuidadores, public.lembretes_enviados
  from authenticated;

-- Comandos que não passam pelo RLS: ninguém do app usa
revoke truncate, references, trigger on all tables in schema public from authenticated;


-- ---------------------------------------------------------------------
-- 6. CONFERÊNCIA FINAL
-- Esperado em TODAS as linhas: rls_ativo = true, anon_pode_ler = false,
-- e qtd_politicas > 0.
-- ---------------------------------------------------------------------
select
  c.relname                                    as tabela,
  c.relrowsecurity                             as rls_ativo,
  has_table_privilege('anon', c.oid, 'select') as anon_pode_ler,
  count(p.policyname)                          as qtd_politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity, c.oid
order by c.relname;
