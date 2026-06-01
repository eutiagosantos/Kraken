-- =============================================================================
-- Limpeza total: envios (upload_jobs) + ficheiros temporários do assistente
-- =============================================================================
--
-- ÂMBITO
--   - TODOS os utilizadores (toda a plataforma).
--   - TODAS as linhas em public.upload_jobs (incl. awaiting_creatives / processing).
--   - TODOS os objectos no bucket Storage "wizard_creatives" (metadados em storage.objects).
--
-- RISCOS
--   - Irreversível sem backup.
--   - Publicações em curso quebram; usar em janela de manutenção.
--
-- ONDE CORRER
--   Supabase Dashboard → SQL Editor (role com acesso a public + storage), ou psql.
--
-- NÃO versionar isto como migration de schema: é operação de dados pontual.
--
-- =============================================================================
-- 1) Verificação ANTES (opcional)
-- =============================================================================

-- select count(*) as upload_jobs_count from public.upload_jobs;
-- select count(*) as wizard_creatives_objects from storage.objects where bucket_id = 'wizard_creatives';

-- =============================================================================
-- 2) Apagar ficheiros do bucket wizard_creatives (metadados Storage)
-- =============================================================================
-- Ordem relativamente a upload_jobs é intercambiável (sem FK entre tabelas).

delete from storage.objects
where bucket_id = 'wizard_creatives';

-- =============================================================================
-- 3) Apagar todos os registos de envio
-- =============================================================================

delete from public.upload_jobs;

-- =============================================================================
-- 4) Verificação DEPOIS
-- =============================================================================

-- select count(*) as upload_jobs_count from public.upload_jobs;        -- esperado: 0
-- select count(*) as wizard_creatives_objects from storage.objects
--   where bucket_id = 'wizard_creatives';                              -- esperado: 0
