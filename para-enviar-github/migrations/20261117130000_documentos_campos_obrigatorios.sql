-- =====================================================================
-- CUIDAR · Documentos: arquivo, instituição de origem e tipo são obrigatórios
--
-- APLICADA: no "cuidar-teste" e, em 17/11/2026 (com o OK da Sueide), no principal "cuidar".
--
-- A regra fica no banco (a fechadura), não só na tela:
--   - arquivo: já obrigatório (caminho, formato e tamanho são "not null");
--   - tipo: deixa de ter valor automático ("Outro"); precisa vir escolhido;
--   - instituição de origem: precisa vir preenchida (não vale só espaços).
-- "not valid": a regra vale para todo envio novo e não mexe nos
-- documentos que já estavam guardados no teste.
-- =====================================================================

alter table public.documentos alter column tipo drop default;

alter table public.documentos
  add constraint documentos_origem_obrigatoria
  check (origem is not null and char_length(btrim(origem)) between 1 and 200)
  not valid;
