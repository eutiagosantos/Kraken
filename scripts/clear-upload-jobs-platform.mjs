#!/usr/bin/env node
/**
 * Apaga TODAS as linhas de `public.upload_jobs` (toda a plataforma, todos os estados).
 *
 * Requer variáveis de ambiente:
 *   - NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (nunca commitar; só em CI/local com segredo)
 *
 * Flag obrigatória: --i-am-sure
 *
 * Storage (bucket `wizard_creatives`): o cliente JS não expõe DELETE em storage.objects
 * de forma trivial para wipe total. Para remover também os ficheiros temporários do
 * assistente, corre no Supabase SQL Editor o ficheiro:
 *   scripts/sql/clear-upload-jobs-platform.sql
 * (secção delete em storage.objects + delete em upload_jobs; se já correste este script,
 *  basta executar no SQL só a parte storage.objects, ou reexecutar o SQL completo após
 *  novos uploads de teste).
 */

import { createClient } from "@supabase/supabase-js";

const NIL = "00000000-0000-0000-0000-000000000000";

function usage(exitCode = 1) {
  console.error(`
Uso:
  SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \\
    node scripts/clear-upload-jobs-platform.mjs --i-am-sure

Apaga todas as linhas de public.upload_jobs.
Para limpar também o Storage wizard_creatives, usa scripts/sql/clear-upload-jobs-platform.sql
no Dashboard Supabase (delete em storage.objects).
`.trim());
  process.exit(exitCode);
}

if (!process.argv.includes("--i-am-sure")) {
  console.error("Erro: falta --i-am-sure (operação destrutiva).\n");
  usage();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Erro: define NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.\n");
  usage();
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from("upload_jobs").delete().neq("id", NIL);

if (error) {
  console.error("Falha ao apagar upload_jobs:", error.message);
  process.exit(1);
}

console.log("OK: todas as linhas de upload_jobs foram apagadas.");
console.log(
  "Lembra-te: para apagar objectos no bucket wizard_creatives, executa o SQL em scripts/sql/clear-upload-jobs-platform.sql (delete em storage.objects)."
);
