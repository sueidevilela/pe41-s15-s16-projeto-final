-- =====================================================================
-- CUIDAR · Documentos e exames guardados de verdade
--
-- APLICADA: no "cuidar-teste" e, em 17/11/2026 (com o OK da Sueide), no principal "cuidar".
-- Depende de 20261117000000_rls_paciente_cuidadora.sql (privado.pode_ver_paciente).
--
-- A regra, em português (a mesma das consultas):
--   Você vê, envia e apaga documentos de uma paciente se você É essa
--   paciente, ou se é a CUIDADORA ligada a ela. Ninguém mais. Sem login: nada.
--
-- Onde fica cada coisa:
--   - o ARQUIVO fica no Storage, na pasta PRIVADA "documentos",
--     no caminho <id da paciente>/<código aleatório>.<extensão>;
--   - os DADOS do arquivo (nome, tipo, instituição) ficam na tabela public.documentos.
--   A pasta é privada: o arquivo só é baixado por quem está logado e
--   passa pela regra acima (não existe link público).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tabela com os dados de cada documento (RLS ligado já na criação)
-- ---------------------------------------------------------------------
create table public.documentos (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references public.pacientes(id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 200),
  tipo           text not null default 'Outro' check (tipo in (
                   'Exame laboratorial', 'Laudo ou relatório', 'Imagem de exame',
                   'Receita ou orientação', 'Outro')),
  origem         text check (origem is null or char_length(origem) <= 200),
  caminho        text not null unique check (char_length(caminho) <= 300),
  formato        text not null check (formato in (
                   'application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  tamanho_bytes  bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 10485760),
  enviado_por    uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  -- o arquivo precisa estar na pasta da própria paciente
  constraint documentos_caminho_da_paciente check (caminho like paciente_id::text || '/%')
);
comment on table public.documentos is
  'Documentos e exames enviados pela paciente ou pela cuidadora. Protótipo: só arquivos fictícios.';
alter table public.documentos enable row level security;

create index documentos_paciente_id_idx on public.documentos (paciente_id, criado_em desc);
create index documentos_enviado_por_idx on public.documentos (enviado_por);

create policy "documentos: ver da paciente permitida"
  on public.documentos for select
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));

create policy "documentos: enviar para a paciente permitida"
  on public.documentos for insert
  to authenticated
  with check (
    privado.pode_ver_paciente(paciente_id)
    and enviado_por = (select auth.uid())
  );

create policy "documentos: apagar da paciente permitida"
  on public.documentos for delete
  to authenticated
  using (privado.pode_ver_paciente(paciente_id));
-- Sem política de update: documento enviado não é alterado (apaga e envia de novo).

-- Permissões: sem login, nada; logada, só ver/enviar/apagar (o RLS decide de quem).
-- "truncate" esvaziaria a tabela de TODAS as pacientes passando por cima do RLS.
revoke all on public.documentos from anon;
revoke update, truncate, references, trigger on public.documentos from authenticated;


-- ---------------------------------------------------------------------
-- 2. Pasta privada no Storage (máx. 10 MB; só PDF e imagens)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A pessoa logada pode mexer nesta pasta? (a 1ª parte do caminho é o id da paciente)
create or replace function privado.pode_ver_pasta(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when split_part(p_caminho, '/', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then privado.pode_ver_paciente(split_part(p_caminho, '/', 1)::uuid)
    else false
  end
$$;
revoke all on function privado.pode_ver_pasta(text) from public, anon;
grant execute on function privado.pode_ver_pasta(text) to authenticated;

create policy "documentos (arquivos): ver da paciente permitida"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documentos' and privado.pode_ver_pasta(name));

create policy "documentos (arquivos): enviar para a paciente permitida"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documentos' and privado.pode_ver_pasta(name));

create policy "documentos (arquivos): apagar da paciente permitida"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documentos' and privado.pode_ver_pasta(name));
-- Sem política de update: não dá para sobrescrever um arquivo enviado.
