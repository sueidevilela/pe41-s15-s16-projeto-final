-- =====================================================================
-- CUIDAR · Documentos: cada conta vê só os documentos que ELA enviou
--
-- Por quê: a regra anterior exigia que a conta estivesse ligada a uma
-- ficha de paciente. Para o protótipo do curso isso era configuração
-- demais. Agora basta estar logada.
--
-- A regra, em português:
--   Você vê, envia e apaga só os SEUS documentos. Ninguém mais vê.
--   Sem login: nada.
--   O arquivo fica na pasta privada "documentos", em <id da conta>/<código>.<ext>.
--
-- APLICADA em 17/11/2026 no "cuidar-teste" e no principal "cuidar". Rodar DEPOIS de 20261117120000 e 20261117130000.
-- =====================================================================

-- 1. Tabela: troca as regras "da paciente" por "da própria conta"
drop policy if exists "documentos: ver da paciente permitida"        on public.documentos;
drop policy if exists "documentos: enviar para a paciente permitida" on public.documentos;
drop policy if exists "documentos: apagar da paciente permitida"     on public.documentos;

alter table public.documentos alter column paciente_id drop not null;
alter table public.documentos drop constraint if exists documentos_caminho_da_paciente;
-- o arquivo precisa estar na pasta da própria conta (vale para os envios novos)
alter table public.documentos
  add constraint documentos_caminho_da_conta
  check (caminho like enviado_por::text || '/%')
  not valid;

create policy "documentos: ver os meus"
  on public.documentos for select
  to authenticated
  using (enviado_por = (select auth.uid()));

create policy "documentos: enviar os meus"
  on public.documentos for insert
  to authenticated
  with check (enviado_por = (select auth.uid()));

create policy "documentos: apagar os meus"
  on public.documentos for delete
  to authenticated
  using (enviado_por = (select auth.uid()));

-- 2. Pasta privada: a 1ª parte do caminho precisa ser o id da própria conta
drop policy if exists "documentos (arquivos): ver da paciente permitida"        on storage.objects;
drop policy if exists "documentos (arquivos): enviar para a paciente permitida" on storage.objects;
drop policy if exists "documentos (arquivos): apagar da paciente permitida"     on storage.objects;
drop function if exists privado.pode_ver_pasta(text);

create policy "documentos (arquivos): ver os meus"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documentos (arquivos): enviar os meus"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documentos (arquivos): apagar os meus"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);
