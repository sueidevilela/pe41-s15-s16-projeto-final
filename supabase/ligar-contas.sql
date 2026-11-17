-- =====================================================================
-- CUIDAR · ligar contas de login às fichas (paciente e cuidadora)
--
-- ONDE RODAR: projeto principal "cuidar" (endereço com yqleyuvkzeoaidvvnpjn),
-- DEPOIS da migration 20261117000000_rls_paciente_cuidadora.sql.
--
-- Como funciona: liga cada conta de login (Authentication > Users) à ficha
-- que tem o MESMO e-mail na tabela pacientes ou cuidadores.
--
-- Passo a passo:
--   1. No Table Editor, abra "pacientes" e escolha a paciente fictícia da
--      apresentação. Anote o e-mail dela. Faça o mesmo em "cuidadores".
--   2. Em Authentication > Users > Add user > Create new user, crie as contas
--      com ESSES MESMOS e-mails (marque "Auto Confirm User").
--   3. Rode este arquivo. Pode rodar de novo sempre que criar outra conta.
--
-- Só preenche fichas que ainda não têm conta ligada: não troca nada que já existe.
-- =====================================================================

update public.pacientes p
set user_id = u.id
from auth.users u
where lower(u.email) = lower(p.email)
  and p.user_id is null;

update public.cuidadores c
set user_id = u.id
from auth.users u
where lower(u.email) = lower(c.email)
  and c.user_id is null;

-- Conferência: quais fichas têm conta de login ligada
select 'paciente' as tipo, nome, (user_id is not null) as tem_login from public.pacientes
union all
select 'cuidadora', nome, (user_id is not null) from public.cuidadores
order by tipo, tem_login desc, nome;
