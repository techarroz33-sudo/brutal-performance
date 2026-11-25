-- ============================================================================
-- Brutal Performance — Schema Completo do Supabase (PostgreSQL + Auth + RLS)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Perfis Biométricos e Preferências do Usuário
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  age integer not null default 27 check (age between 14 and 95),
  sex text not null default 'masculino' check (sex in ('masculino', 'feminino')),
  weight_kg numeric(5,1) not null check (weight_kg between 35 and 250),
  height_cm integer not null check (height_cm between 120 and 230),
  waist_cm integer not null default 80 check (waist_cm between 50 and 180),
  goal text not null default 'crescimento_muscular' check (goal in ('crescimento_muscular', 'perda_peso', 'manter_forma')),
  activity_level text not null default 'moderado' check (activity_level in ('sedentario', 'leve', 'moderado', 'intenso', 'atleta')),
  experience text not null default 'intermediario' check (experience in ('iniciante', 'intermediario', 'avancado')),
  days_per_week integer not null default 4 check (days_per_week between 1 and 7),
  workout_environment text not null default 'academia' check (workout_environment in ('academia', 'casa')),
  active_split_id text not null default 'A' check (active_split_id in ('A', 'B', 'C', 'D', 'E')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Progresso das Séries e Cargas por Exercício
create table if not exists public.workout_exercise_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (goal in ('crescimento_muscular', 'perda_peso', 'manter_forma')),
  environment text not null check (environment in ('academia', 'casa')),
  exercise_id text not null,
  sets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, goal, environment, exercise_id)
);

-- 3. Refeições Diárias & Diário Alimentar
create table if not exists public.daily_meals (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null default current_date,
  meal_order text not null default '01',
  time text not null,
  title text not null,
  description text not null default '',
  kcal integer not null default 0,
  protein_g integer not null default 0,
  carbs_g integer not null default 0,
  fat_g integer not null default 0,
  fiber_g integer not null default 0,
  tag text not null default 'Refeição',
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_date, id)
);

-- 4. Hidratação Diária, Hábitos, Suplementos e Descanso Ativo
create table if not exists public.daily_wellness_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  water_ml integer not null default 0,
  habits jsonb not null default '[]'::jsonb,
  supplements jsonb not null default '[]'::jsonb,
  rest_activity_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

alter table public.daily_wellness_logs
  add column if not exists supplements jsonb not null default '[]'::jsonb;
alter table public.daily_wellness_logs
  add column if not exists rest_activity_ids jsonb not null default '[]'::jsonb;

-- 5. Histórico de Peso, Cintura e Composição Corporal
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  weight_kg numeric(5,1) not null,
  waist_cm integer,
  volume_kg integer not null default 0,
  bf_percent numeric(4,1) not null,
  recorded_at timestamptz not null default now()
);

-- 6. Histórico de Análise de Alimentos & Compensação Calórica
create table if not exists public.food_analysis_entries (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  items jsonb not null default '[]'::jsonb,
  total_kcal integer not null,
  calories_to_lose integer not null,
  protein_g integer not null default 0,
  carbs_g integer not null default 0,
  fat_g integer not null default 0,
  fat_gain_grams integer not null default 0,
  scale_retention_grams integer not null default 0,
  burn_equivalents jsonb not null default '[]'::jsonb,
  recovery_plan_note text not null default '',
  compensated boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Índices auxiliares
create index if not exists idx_daily_meals_user_date on public.daily_meals (user_id, meal_date);
create index if not exists idx_weight_entries_user_time on public.weight_entries (user_id, recorded_at);
create index if not exists idx_food_analysis_user_time on public.food_analysis_entries (user_id, created_at desc);

-- ============================================================================
-- Row Level Security (RLS) — Isolamento estrito por usuário autenticado
-- ============================================================================
alter table public.user_profiles enable row level security;
alter table public.workout_exercise_logs enable row level security;
alter table public.daily_meals enable row level security;
alter table public.daily_wellness_logs enable row level security;
alter table public.weight_entries enable row level security;
alter table public.food_analysis_entries enable row level security;

drop policy if exists "user_profiles_own_all" on public.user_profiles;
create policy "user_profiles_own_all"
  on public.user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workout_exercise_logs_own_all" on public.workout_exercise_logs;
create policy "workout_exercise_logs_own_all"
  on public.workout_exercise_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_meals_own_all" on public.daily_meals;
create policy "daily_meals_own_all"
  on public.daily_meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_wellness_logs_own_all" on public.daily_wellness_logs;
create policy "daily_wellness_logs_own_all"
  on public.daily_wellness_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weight_entries_own_all" on public.weight_entries;
create policy "weight_entries_own_all"
  on public.weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "food_analysis_entries_own_all" on public.food_analysis_entries;
create policy "food_analysis_entries_own_all"
  on public.food_analysis_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Confirma usuários antigos criados antes de desativar "Confirm email" no Supabase
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

