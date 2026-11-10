-- Схема личного дашборда задач: разделы → проекты → задачи, теги.
-- Каждая строка принадлежит пользователю (user_id), доступ ограничен RLS.
-- Роль anon (запросы без входа) не получает доступа ни к одной таблице.
-- Уже применённую миграцию не редактируем: изменения — только новыми файлами.

-- ─── Типы ────────────────────────────────────────────────────────────────────

create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ─── Таблицы ─────────────────────────────────────────────────────────────────

create table public.areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  color      text not null default '#6366f1',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  area_id     uuid not null references public.areas on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  color       text not null default '#6366f1',
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  project_id   uuid references public.projects on delete cascade,
  -- задача прямо в разделе, без проекта; project_id и area_id оба null = «Входящие»
  area_id      uuid references public.areas on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  status       public.task_status not null default 'todo',
  priority     public.task_priority not null default 'medium',
  due_date     date,
  completed_at timestamptz,
  recurrence   jsonb,  -- null = обычная задача
  series_id    uuid,   -- общий id всех экземпляров одной повторяющейся задачи
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tasks_single_location check (project_id is null or area_id is null),
  constraint tasks_recurrence_needs_due check (recurrence is null or due_date is not null),
  constraint tasks_recurrence_type check (
    recurrence is null
    or recurrence->>'type' in ('daily', 'every_n_days', 'weekly', 'monthly')
  )
);

create table public.tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name    text not null check (char_length(name) between 1 and 40),
  color   text not null default '#64748b',
  unique (user_id, name)
);

create table public.task_tags (
  task_id uuid not null references public.tasks on delete cascade,
  tag_id  uuid not null references public.tags on delete cascade,
  primary key (task_id, tag_id)
);

-- ─── Индексы ─────────────────────────────────────────────────────────────────

create index areas_user_id_idx on public.areas (user_id);
create index projects_user_id_idx on public.projects (user_id);
create index projects_area_id_idx on public.projects (area_id);
create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_area_id_idx on public.tasks (area_id);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index tasks_user_completed_at_idx on public.tasks (user_id, completed_at);
create index task_tags_tag_id_idx on public.task_tags (tag_id);

-- ─── Триггеры ────────────────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- completed_at всегда согласован со статусом: ставится при переходе в done
-- (если не задан явно — например, демо-данными) и очищается при выходе из done.
create function public.sync_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if new.completed_at is null then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.sync_completed_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.areas enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;

create policy "owner manages areas" on public.areas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "owner manages tags" on public.tags
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Проект можно положить только в свой раздел.
create policy "owner manages projects" on public.projects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.areas a
      where a.id = projects.area_id and a.user_id = (select auth.uid())
    )
  );

-- Задачу можно положить только в свой проект или свой раздел.
create policy "owner manages tasks" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      tasks.project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = tasks.project_id and p.user_id = (select auth.uid())
      )
    )
    and (
      tasks.area_id is null
      or exists (
        select 1 from public.areas a
        where a.id = tasks.area_id and a.user_id = (select auth.uid())
      )
    )
  );

-- Связь задачи и тега доступна, только если обе стороны принадлежат пользователю.
create policy "owner manages task tags" on public.task_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_tags.task_id and t.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags g
      where g.id = task_tags.tag_id and g.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_tags.task_id and t.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags g
      where g.id = task_tags.tag_id and g.user_id = (select auth.uid())
    )
  );

-- ─── Представления прогресса ─────────────────────────────────────────────────
-- security_invoker = true обязателен: иначе представление читает таблицы
-- с правами владельца и обходит RLS. Процент считается на клиенте.
-- Повторяющиеся задачи в прогрессе не учитываются.

create view public.project_progress with (security_invoker = true) as
select p.id as project_id,
       count(t.id) filter (where t.recurrence is null)                       as total,
       count(t.id) filter (where t.recurrence is null and t.status = 'done') as done
from public.projects p
left join public.tasks t on t.project_id = p.id
group by p.id;

-- Задачи раздела = лежащие в нём напрямую + задачи его неархивных проектов.
create view public.area_progress with (security_invoker = true) as
with area_tasks as (
  select t.area_id, t.status, t.recurrence
  from public.tasks t
  where t.area_id is not null
  union all
  select p.area_id, t.status, t.recurrence
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where p.archived_at is null
)
select a.id as area_id,
       count(x.area_id) filter (where x.recurrence is null)                       as total,
       count(x.area_id) filter (where x.recurrence is null and x.status = 'done') as done
from public.areas a
left join area_tasks x on x.area_id = a.id
group by a.id;

-- ─── RPC: выполнение повторяющейся задачи ────────────────────────────────────
-- Отмечает текущий экземпляр выполненным и создаёт следующий с датой p_next_due.
-- Дату считает клиент (getNextDueDate), чтобы логика дат жила в одном месте.
-- Всё выполняется в одной транзакции вызова.

create function public.complete_recurring_task(p_task_id uuid, p_next_due date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_task      public.tasks%rowtype;
  v_series_id uuid;
  v_new_id    uuid;
begin
  select * into v_task
  from public.tasks
  where id = p_task_id and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Задача не найдена';
  end if;
  if v_task.recurrence is null then
    raise exception 'Задача не повторяющаяся';
  end if;
  if v_task.status = 'done' then
    raise exception 'Задача уже выполнена';
  end if;
  if p_next_due is null or p_next_due <= v_task.due_date then
    raise exception 'Следующий срок должен быть позже текущего';
  end if;

  v_series_id := coalesce(v_task.series_id, v_task.id);

  update public.tasks
  set status = 'done', series_id = v_series_id
  where id = v_task.id;

  insert into public.tasks
    (project_id, area_id, title, description, priority, recurrence, series_id, status, due_date)
  values
    (v_task.project_id, v_task.area_id, v_task.title, v_task.description, v_task.priority,
     v_task.recurrence, v_series_id, 'todo', p_next_due)
  returning id into v_new_id;

  insert into public.task_tags (task_id, tag_id)
  select v_new_id, tt.tag_id
  from public.task_tags tt
  where tt.task_id = v_task.id;

  return v_new_id;
end;
$$;

-- ─── Права ───────────────────────────────────────────────────────────────────
-- Supabase по умолчанию выдаёт anon права на новые таблицы. RLS и так не пустит
-- anon без политик, но явный отзыв прав — второй замок.

revoke all on public.areas, public.projects, public.tasks, public.tags, public.task_tags
  from anon;
revoke all on public.project_progress, public.area_progress from anon;

revoke execute on function public.complete_recurring_task(uuid, date) from public, anon;
grant execute on function public.complete_recurring_task(uuid, date) to authenticated;
