-- ============================================================
-- MEGAPORT SERVIÇOS — schema do banco de dados (Supabase/Postgres)
-- ============================================================
-- COMO USAR:
-- 1. Crie um projeto gratuito em https://supabase.com
-- 2. Abra "SQL Editor" no menu lateral do projeto
-- 3. Cole todo o conteúdo deste arquivo e clique em "Run"
-- Isso cria as tabelas, ativa a segurança por linha (RLS) e
-- define quem pode ler/escrever cada coisa.
-- ============================================================

-- Extensão para gerar IDs únicos (uuid) — já vem habilitada por
-- padrão na maioria dos projetos Supabase, mas garantimos aqui:
create extension if not exists "pgcrypto";


-- ============ TABELA: services ============
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  icon         text not null default 'especiais',
  title        text not null,
  description  text not null default '',
  featured     boolean not null default false,
  badge        text not null default 'Destaque',
  link_type    text not null default 'whatsapp' check (link_type in ('whatsapp', 'anchor', 'url')),
  link_value   text not null default '',
  link_label   text not null default 'Pedir orçamento',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============ TABELA: coupons ============
create table if not exists public.coupons (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  code         text not null,
  description  text not null default '',
  valid_until  date,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);


-- ============ updated_at automático ============
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();


-- ============ SEGURANÇA (Row Level Security) ============
-- Regra geral deste site:
--   - QUALQUER pessoa (visitante do site, sem login) pode LER
--     serviços e cupons — afinal isso é o que aparece no site público.
--   - Só um usuário AUTENTICADO (logado no painel admin) pode
--     criar, editar ou excluir. Como este site tem um único dono,
--     não criamos papéis/permissões separadas — qualquer login
--     válido é o administrador.

alter table public.services enable row level security;
alter table public.coupons  enable row level security;

-- Leitura pública (site)
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public"
  on public.services for select
  to anon, authenticated
  using (true);

drop policy if exists "coupons_select_public" on public.coupons;
create policy "coupons_select_public"
  on public.coupons for select
  to anon, authenticated
  using (true);

-- Escrita só para quem está logado (painel admin)
drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "coupons_write_admin" on public.coupons;
create policy "coupons_write_admin"
  on public.coupons for all
  to authenticated
  using (true)
  with check (true);


-- ============ LIMITE DE REQUISIÇÕES ============
-- O Supabase já aplica limites de requisição automáticos na API
-- (nível de infraestrutura, plano gratuito inclui proteção contra
-- abuso). Não é necessário configurar nada extra aqui.
-- Se quiser um limite ainda mais específico (ex: no máximo N
-- cupons criados por hora), isso pode ser adicionado depois com
-- uma Edge Function — avise se quiser esse reforço.


-- ============ DADOS INICIAIS (os mesmos que já existiam no site) ============
insert into public.services (icon, title, description, featured, badge, link_type, link_value, link_label, sort_order) values
('pombos', 'Controle de Pombos', 'Afastamos pombos de forma discreta e definitiva, sem agredir o ambiente nem a estética do local. 1ª autorizada Bird Control do Rio Grande do Sul.', true, 'Destaque', 'anchor', '#pombos', 'Saber mais', 1),
('zeladoria', 'Zeladoria', 'Portaria, controle de acesso e cuidado diário com o seu espaço, do jeito que ele precisa.', false, '', 'whatsapp', 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.', 'Pedir orçamento', 2),
('limpeza', 'Limpeza', 'Limpeza de áreas comuns, comerciais e residenciais, com rotina e padrão combinados com você.', false, '', 'whatsapp', 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.', 'Pedir orçamento', 3),
('manutencao', 'Manutenção', 'Reparos e manutenção preventiva pra evitar que um problema pequeno vire um grande.', false, '', 'whatsapp', 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.', 'Pedir orçamento', 4),
('jardinagem', 'Jardinagem', 'Poda, conservação e cuidado das áreas verdes, pra manter tudo bonito o ano inteiro.', false, '', 'whatsapp', 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.', 'Pedir orçamento', 5),
('especiais', 'Serviços Especiais', 'Demandas pontuais e projetos fora da rotina, com a mesma agilidade de sempre.', false, '', 'whatsapp', 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.', 'Pedir orçamento', 6)
on conflict do nothing;

insert into public.coupons (title, code, description, valid_until, active) values
('Exemplo — Cupom de boas-vindas', 'BEMVINDO10', '10% de desconto no primeiro serviço contratado. Edite ou desative este exemplo no painel admin.', null, false)
on conflict do nothing;
