-- Проверка схемы на настоящей базе без следов: всё выполняется в одной
-- транзакции и в конце откатывается. Любая неудачная проверка прерывает
-- скрипт с ошибкой, при успехе последняя строка — «Все проверки пройдены».
--
-- Запуск: npm run db:test
--
-- Тестовые пользователи создаются прямо в auth.users и исчезают при откате.

begin;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'owner@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'other@example.test');

-- ─── Владелец: данные ────────────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';

insert into public.areas (id, name) values
  ('a0000000-0000-4000-8000-000000000001', 'Учёба'),
  ('a0000000-0000-4000-8000-000000000002', 'Пустой раздел');

insert into public.projects (id, area_id, name, archived_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Курс', null),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Старый курс', now());

insert into public.tags (id, name) values
  ('c0000000-0000-4000-8000-000000000001', 'чтение');

-- Раздел «Учёба»: 2 задачи напрямую (1 готова), 3 в активном проекте (2 готовы),
-- 1 повторяющаяся в активном проекте, 2 готовые в архивном проекте.
-- Ожидаемый прогресс раздела: 3 из 5. Архивный проект и повторяющаяся не входят.
insert into public.tasks (id, area_id, project_id, title, status, due_date, recurrence) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', null, 'Прямо в разделе 1', 'done', null, null),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', null, 'Прямо в разделе 2', 'todo', null, null),
  ('d0000000-0000-4000-8000-000000000003', null, 'b0000000-0000-4000-8000-000000000001', 'В проекте 1', 'done', null, null),
  ('d0000000-0000-4000-8000-000000000004', null, 'b0000000-0000-4000-8000-000000000001', 'В проекте 2', 'done', null, null),
  ('d0000000-0000-4000-8000-000000000005', null, 'b0000000-0000-4000-8000-000000000001', 'В проекте 3', 'in_progress', null, null),
  ('d0000000-0000-4000-8000-000000000006', null, 'b0000000-0000-4000-8000-000000000001', 'Повтор', 'todo', '2026-11-10', '{"type":"daily"}'),
  ('d0000000-0000-4000-8000-000000000007', null, 'b0000000-0000-4000-8000-000000000002', 'В архиве 1', 'done', null, null),
  ('d0000000-0000-4000-8000-000000000008', null, 'b0000000-0000-4000-8000-000000000002', 'В архиве 2', 'done', null, null),
  ('d0000000-0000-4000-8000-000000000009', null, null, 'Во входящих', 'todo', null, null);

insert into public.task_tags (task_id, tag_id) values
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001');

-- ─── Владелец: прогресс ──────────────────────────────────────────────────────

do $$
declare
  v_total bigint;
  v_done  bigint;
begin
  select total, done into v_total, v_done from public.area_progress
  where area_id = 'a0000000-0000-4000-8000-000000000001';
  assert v_total = 5 and v_done = 3,
    format('area_progress «Учёба»: ожидалось 3 из 5, получено %s из %s', v_done, v_total);

  select total, done into v_total, v_done from public.area_progress
  where area_id = 'a0000000-0000-4000-8000-000000000002';
  assert v_total = 0 and v_done = 0,
    format('area_progress пустого раздела: ожидалось 0 из 0, получено %s из %s', v_done, v_total);

  select total, done into v_total, v_done from public.project_progress
  where project_id = 'b0000000-0000-4000-8000-000000000001';
  assert v_total = 3 and v_done = 2,
    format('project_progress «Курс»: ожидалось 2 из 3, получено %s из %s', v_done, v_total);

  select total, done into v_total, v_done from public.project_progress
  where project_id = 'b0000000-0000-4000-8000-000000000002';
  assert v_total = 2 and v_done = 2,
    format('project_progress архивного проекта: ожидалось 2 из 2, получено %s из %s', v_done, v_total);
end;
$$;

-- ─── Владелец: триггеры и ограничения ───────────────────────────────────────

do $$
declare
  v_completed timestamptz;
begin
  select completed_at into v_completed from public.tasks
  where id = 'd0000000-0000-4000-8000-000000000001';
  assert v_completed is not null, 'completed_at не проставился при вставке в статусе done';

  update public.tasks set status = 'todo' where id = 'd0000000-0000-4000-8000-000000000001';
  select completed_at into v_completed from public.tasks
  where id = 'd0000000-0000-4000-8000-000000000001';
  assert v_completed is null, 'completed_at не очистился при возврате в todo';

  update public.tasks set status = 'done' where id = 'd0000000-0000-4000-8000-000000000001';
  select completed_at into v_completed from public.tasks
  where id = 'd0000000-0000-4000-8000-000000000001';
  assert v_completed is not null, 'completed_at не проставился при переходе в done';

  begin
    insert into public.tasks (area_id, project_id, title) values
      ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'И там, и там');
    raise exception 'ПРОВАЛ: задача сразу в проекте и в разделе была сохранена';
  exception when check_violation then null;
  end;

  begin
    insert into public.tasks (title, recurrence) values ('Повтор без срока', '{"type":"daily"}');
    raise exception 'ПРОВАЛ: повторяющаяся задача без срока была сохранена';
  exception when check_violation then null;
  end;
end;
$$;

-- ─── Владелец: RPC complete_recurring_task ───────────────────────────────────

do $$
declare
  v_new_id uuid;
  v_old    public.tasks%rowtype;
  v_new    public.tasks%rowtype;
  v_tags   int;
begin
  v_new_id := public.complete_recurring_task('d0000000-0000-4000-8000-000000000006', '2026-11-11');

  select * into v_old from public.tasks where id = 'd0000000-0000-4000-8000-000000000006';
  select * into v_new from public.tasks where id = v_new_id;

  assert v_old.status = 'done', 'RPC: текущий экземпляр не стал done';
  assert v_old.completed_at is not null, 'RPC: у текущего экземпляра нет completed_at';
  assert v_old.series_id = v_old.id, 'RPC: series_id текущего экземпляра не равен его id';
  assert v_new.status = 'todo', 'RPC: новый экземпляр не в статусе todo';
  assert v_new.due_date = '2026-11-11', 'RPC: у нового экземпляра неверный срок';
  assert v_new.series_id = v_old.id, 'RPC: новый экземпляр не в той же серии';
  assert v_new.project_id = v_old.project_id, 'RPC: новый экземпляр в другом проекте';
  assert v_new.recurrence = v_old.recurrence, 'RPC: правило повторения не скопировано';

  select count(*) into v_tags from public.task_tags where task_id = v_new_id;
  assert v_tags = 1, 'RPC: теги не скопированы';

  begin
    perform public.complete_recurring_task('d0000000-0000-4000-8000-000000000006', '2026-11-12');
    raise exception 'ПРОВАЛ: RPC повторно выполнил уже выполненную задачу';
  exception when raise_exception then
    assert sqlerrm = 'Задача уже выполнена', 'RPC: неожиданная ошибка: ' || sqlerrm;
  end;

  begin
    perform public.complete_recurring_task(v_new_id, '2026-11-11');
    raise exception 'ПРОВАЛ: RPC принял срок, не позже текущего';
  exception when raise_exception then
    assert sqlerrm = 'Следующий срок должен быть позже текущего', 'RPC: неожиданная ошибка: ' || sqlerrm;
  end;

  begin
    perform public.complete_recurring_task('d0000000-0000-4000-8000-000000000002', '2026-12-01');
    raise exception 'ПРОВАЛ: RPC выполнил обычную задачу';
  exception when raise_exception then
    assert sqlerrm = 'Задача не повторяющаяся', 'RPC: неожиданная ошибка: ' || sqlerrm;
  end;
end;
$$;

-- ─── Другой пользователь не видит и не трогает чужое ────────────────────────

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}';

do $$
declare
  v_count bigint;
begin
  select (select count(*) from public.areas)
       + (select count(*) from public.projects)
       + (select count(*) from public.tasks)
       + (select count(*) from public.tags)
       + (select count(*) from public.task_tags)
       + (select count(*) from public.area_progress)
       + (select count(*) from public.project_progress)
    into v_count;
  assert v_count = 0, format('Другой пользователь видит %s чужих строк', v_count);

  begin
    insert into public.projects (area_id, name)
    values ('a0000000-0000-4000-8000-000000000001', 'Проект в чужом разделе');
    raise exception 'ПРОВАЛ: удалось создать проект в чужом разделе';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (project_id, title)
    values ('b0000000-0000-4000-8000-000000000001', 'Задача в чужом проекте');
    raise exception 'ПРОВАЛ: удалось создать задачу в чужом проекте';
  exception when insufficient_privilege then null;
  end;

  update public.tasks set title = 'Взлом' where id = 'd0000000-0000-4000-8000-000000000002';
  get diagnostics v_count = row_count;
  assert v_count = 0, 'Другой пользователь изменил чужую задачу';

  begin
    perform public.complete_recurring_task('d0000000-0000-4000-8000-000000000005', '2026-12-01');
    raise exception 'ПРОВАЛ: RPC выполнил чужую задачу';
  exception when raise_exception then
    assert sqlerrm = 'Задача не найдена', 'RPC: неожиданная ошибка: ' || sqlerrm;
  end;
end;
$$;

-- ─── Без входа (anon) доступа нет ────────────────────────────────────────────

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

do $$
declare
  v_relation text;
begin
  foreach v_relation in array array[
    'areas', 'projects', 'tasks', 'tags', 'task_tags', 'area_progress', 'project_progress'
  ] loop
    begin
      execute format('select count(*) from public.%I', v_relation);
      raise exception 'ПРОВАЛ: anon может читать public.%', v_relation;
    exception when insufficient_privilege then null;
    end;
  end loop;

  begin
    perform public.complete_recurring_task('d0000000-0000-4000-8000-000000000002', '2026-12-01');
    raise exception 'ПРОВАЛ: anon может вызвать complete_recurring_task';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select 'Все проверки пройдены' as result;

rollback;
