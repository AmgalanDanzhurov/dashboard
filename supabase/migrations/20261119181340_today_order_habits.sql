-- Вторая миграция: план дня, свой порядок задач, трекер привычек.
-- Только добавляет новое; существующие строки не меняются, кроме заполнения
-- sort_order по дате создания.

-- ─── Задачи: план дня и свой порядок ─────────────────────────────────────────

-- В плане дня на эту дату. Назавтра дата уже не «сегодня», и задача сама
-- уходит из плана — чистить ничего не нужно.
alter table public.tasks add column planned_for date;

-- Свой порядок: меньше — выше. Дробное число, чтобы при перетаскивании
-- обновлять одну строку (значение между соседями), а не весь список.
-- По умолчанию — миллисекунды текущего времени: новая задача встаёт в конец.
alter table public.tasks
  add column sort_order double precision not null
  default (extract(epoch from clock_timestamp()) * 1000);

-- Существующие задачи — в порядке создания.
update public.tasks set sort_order = extract(epoch from created_at) * 1000;

create index tasks_user_planned_for_idx on public.tasks (user_id, planned_for);

-- ─── Привычки ────────────────────────────────────────────────────────────────

create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#16a34a',
  -- ISO: 1 = пн … 7 = вс. Хотя бы один день, только значения 1–7.
  weekdays    smallint[] not null default '{1,2,3,4,5,6,7}',
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint habits_weekdays_valid check (
    cardinality(weekdays) between 1 and 7
    and weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]
  )
);

-- Отметка «сделано» за календарный день (в часовом поясе браузера).
create table public.habit_checks (
  habit_id uuid not null references public.habits on delete cascade,
  user_id  uuid not null default auth.uid() references auth.users on delete cascade,
  day      date not null,
  primary key (habit_id, day)
);

create index habits_user_id_idx on public.habits (user_id);
create index habit_checks_user_day_idx on public.habit_checks (user_id, day);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;

create policy "owner manages habits" on public.habits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Отметку можно поставить только своей привычке.
create policy "owner manages habit checks" on public.habit_checks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.habits h
      where h.id = habit_checks.habit_id and h.user_id = (select auth.uid())
    )
  );

-- Как и для остальных таблиц: anon не получает ничего.
revoke all on public.habits, public.habit_checks from anon;
