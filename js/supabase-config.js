/**
 * MEGAPORT SERVIÇOS — configuração de conexão com o Supabase
 * ------------------------------------------------------------------
 * Preencha os dois valores abaixo depois de criar seu projeto em
 * https://supabase.com (veja o passo a passo em SETUP.md).
 *
 * Onde encontrar esses valores: dentro do seu projeto Supabase,
 * vá em "Project Settings" (ícone de engrenagem) → "API".
 *   - SUPABASE_URL  = campo "Project URL"
 *   - SUPABASE_ANON_KEY = campo "anon public" (em "Project API keys")
 *
 * IMPORTANTE: a "anon key" é segura para deixar exposta no código do
 * site — ela é *feita* para uso público no navegador. Quem protege os
 * dados de verdade são as regras de segurança (RLS) definidas em
 * supabase/schema.sql, não o sigilo dessa chave. NUNCA coloque aqui a
 * "service_role key" (essa sim é secreta e nunca deve ir para o site).
 */

const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_KEY_DO_SEU_PROJETO';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
