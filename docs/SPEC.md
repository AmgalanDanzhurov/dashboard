# Промт для Claude Code: дашборд задач

20 октября 2026, изменено 10 ноября 2026 (см. «Изменения ТЗ» в конце)

## Как пользоваться

Этот документ — одновременно ТЗ и промт: Claude Code будет сверяться с ним на каждом этапе, поэтому лучше хранить его прямо в репозитории.

1. Создай пустой репозиторий на GitHub, склонируй его и открой папку в Claude Code.
2. Сохрани этот файл как `docs/SPEC.md`.
3. Отправь первое сообщение:

```
Прочитай docs/SPEC.md целиком — это ТЗ проекта. Если что-то неясно или противоречиво, задай вопросы. Затем предложи план этапа 1 и начни после моего подтверждения.
```

4. Дальше веди работу по разделу «План работы»: один этап — одна сессия и один или несколько коммитов.

Если не хочешь класть файл в репозиторий, можно вставить в Claude Code весь текст начиная с раздела «Роль и цель».

## Роль и цель

Ты — senior fullstack-разработчик. Мы вместе строим личный веб-дашборд задач: я веду проекты и задачи, а приложение показывает, сколько сделано и как идёт работа во времени.

- **Пользователь:** один человек (я), личный инструмент. Командной работы нет.
- **Хостинг:** GitHub Pages — только статические файлы. Бэкенд: Supabase (Postgres, Auth, RLS).
- **Стек:** Next.js в режиме статического экспорта + Supabase, подробности ниже.
- **Интерфейс:** на русском, адаптивный (телефон и ноутбук), светлая и тёмная тема.
- **Приоритеты:** простота, надёжность, понятный код. Не усложняй без причины — я хочу понимать каждое решение.

## Функциональные требования

Трёхуровневая структура «разделы → проекты → задачи», прогресс считается по количеству выполненных задач, визуализация — прогресс-бары, кольца и графики.

**Разделы**

- Крупные сферы жизни, например «Учёба», «Работа», «Личное».
- Создание, редактирование: название, цвет, порядок отображения.
- Архивации у разделов нет.
- Удаление — только с подтверждением, в котором указано, сколько проектов и задач будет удалено; удаляет проекты и задачи раздела каскадно.

**Проекты**

- Каждый проект принадлежит ровно одному разделу; раздел обязателен.
- Создание, редактирование: название, описание, цвет, раздел. Проект можно перенести в другой раздел.
- Архивация вместо удаления: архивные скрыты с дашборда, их можно показать и восстановить.
- Удаление — только с подтверждением, удаляет задачи проекта каскадно.

**Задачи**

- Поля: название, описание (обычный текст), статус (`todo` / `in_progress` / `done`), приоритет (`low` / `medium` / `high` / `urgent`), дедлайн (дата, необязателен), теги, расположение.
- Расположение задачи — одно из трёх: проект; раздел без проекта (мелкие дела вроде «Личное: купить продукты»); ничего — тогда задача во «Входящих». Задача не ссылается одновременно на проект и на раздел: раздел задачи в проекте определяется проектом.
- Быстрое добавление одной строкой (Enter — создать).
- Выполнение — чекбоксом; смена статуса и приоритета — из выпадающего списка.
- Фильтры: раздел, проект, статус, приоритет, теги, срок (просрочено / сегодня / 7 дней / без срока). Поиск по названию. Сортировка: срок, приоритет, дата создания.
- Просроченная задача: дедлайн раньше сегодняшнего дня и статус не `done`.

**Повторяющиеся задачи**

- Правила: каждый день, каждые N дней, по выбранным дням недели, каждый месяц в указанное число.
- У повторяющейся задачи обязателен дедлайн.
- При выполнении текущий экземпляр получает `done`, и сразу создаётся следующий с новым дедлайном, тем же расположением и теми же тегами.
- Выполнение любым способом — чекбоксом или выбором `done` в выпадающем списке статуса — идёт через RPC и создаёт следующий экземпляр. Иначе повторение тихо прекратится.
- Удаление повторяющейся задачи удаляет только текущий экземпляр: повторение прекращается, выполненные экземпляры остаются в истории.

**Теги**

- Создание, переименование, удаление; цвет; имя уникально.

**Цвета**

- Цвет раздела, проекта и тега выбирается из фиксированной палитры примерно из 10 цветов, проверенной в светлой и тёмной теме. Произвольный hex не вводится, но в БД цвет хранится как hex.

**Прогресс и статистика**

- Прогресс проекта = выполненные задачи / все задачи проекта. Повторяющиеся задачи в прогрессе не учитываются, иначе проект никогда не достигнет 100%.
- Прогресс раздела = выполненные / все задачи раздела: лежащие в нём напрямую и в его неархивных проектах. Повторяющиеся не учитываются.
- Задачи архивных проектов не показываются в списках, блоках по срокам и KPI «в работе» и «просрочено», не входят в прогресс раздела, но учитываются в истории: «выполнено сегодня» и «за 7 дней», графики, серия.
- KPI: выполнено сегодня, выполнено за 7 дней, в работе, просрочено, серия дней подряд с хотя бы одной выполненной задачей.
- Графики: выполнено по дням за период (7 / 30 / 90 дней), открытые задачи по статусам и приоритетам, выполненные задачи по разделам и по тегам, burndown проекта (открытые задачи по дням, без повторяющихся — иначе график не дойдёт до нуля).

**Авторизация**

- Вход по email и паролю через Supabase Auth. Регистрации в интерфейсе нет: аккаунт создаётся вручную, регистрация в Supabase отключена.
- Все страницы, кроме `/login`, доступны только после входа. Есть кнопка выхода.

**Вне рамок (не делать)**

- Командная работа, роли, назначение исполнителей.
- Подзадачи, канбан-доска, диаграмма Ганта.
- Вложенность глубже трёх уровней (подразделы, подпроекты).
- Уведомления, вложения, учёт времени, офлайн-режим.

## Стек и ограничения GitHub Pages

GitHub Pages отдаёт только статику, поэтому Next.js собирается через `output: 'export'`, а все данные и авторизация идут из браузера напрямую в Supabase. Ставь актуальные стабильные версии пакетов и сверяйся с их документацией.

| Слой | Технология | Назначение |
| --- | --- | --- |
| Фреймворк | Next.js (App Router) + TypeScript strict | Статический экспорт в `out/` |
| UI | Tailwind CSS + shadcn/ui | Компоненты, тема |
| Графики | Recharts (обёртки shadcn/ui charts) | Бары, кольца, линии |
| Данные | @supabase/supabase-js + TanStack Query | Запросы, кэш, optimistic updates |
| Формы | react-hook-form + zod | Ввод и валидация |
| Даты | date-fns + локаль `ru` | Форматирование, расчёт дат |
| Тема | next-themes | Светлая / тёмная |
| Уведомления | sonner | Toast об успехе и ошибках |
| БД и Auth | Supabase: Postgres, Auth, RLS, Supabase CLI | Хранение, вход, миграции |
| Тесты | Vitest | Чистая доменная логика |
| CI/CD | GitHub Actions → GitHub Pages | Сборка и публикация |

**Обязательные ограничения**

- `next.config`: `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`, `basePath` и `assetPrefix` из `NEXT_PUBLIC_BASE_PATH`. Для репозитория `<user>.github.io/<repo>` это `/<repo>`, для репозитория `<user>.github.io` — пустая строка.
- Запрещено: Server Actions, Route Handlers (`app/api`), middleware, `next/headers`, `cookies()`, серверная загрузка данных, ISR, оптимизация `next/image`.
- Нет динамических сегментов с пользовательскими id (`/projects/[id]`): при статическом экспорте их нельзя сгенерировать. Вместо них — query-параметры: `/project/?id=<uuid>`. Компоненты с `useSearchParams` оборачивать в `<Suspense>`.
- Все страницы с данными — клиентские компоненты (`'use client'`).
- В бандл попадают только `NEXT_PUBLIC_SUPABASE_URL` и publishable (anon) ключ. Защиту данных обеспечивает RLS. Ключ `service_role` в коде приложения не используется никогда.
- Сессию хранит supabase-js в localStorage; защита маршрутов — клиентский `AuthGuard`.
- Ссылки и редиректы только через `next/link` и `useRouter`, чтобы учитывался `basePath`. Никаких захардкоженных путей от корня.

## Архитектура

Слоистая feature-based архитектура: страница → компоненты фичи → хуки → API-слой → Supabase. Доменная логика — чистые функции без React и Supabase.

```
app/ (маршруты)
  └─ features/<фича>/components   UI фичи
       └─ features/<фича>/hooks.ts    TanStack Query: кэш, мутации
            └─ features/<фича>/api.ts     единственное место вызовов supabase-js
                 └─ Supabase (Postgres + RLS + Auth)

lib/domain/  чистые функции: прогресс, повторения, статистика, фильтры
             используются хуками и компонентами, покрыты тестами
```

**Правила слоёв**

1. `app/` — только маршруты и компоновка страниц: без бизнес-логики и прямых запросов.
2. `features/<фича>/components` — UI. Компоненты не импортируют клиент Supabase.
3. `features/<фича>/hooks.ts` — хуки TanStack Query (`useProjects`, `useCreateTask` и т. п.). Ключи запросов — в `lib/query/queryKeys.ts`. После мутаций — инвалидация связанных запросов. Смена статуса задачи — optimistic update с откатом при ошибке.
4. `features/<фича>/api.ts` — функции запросов к Supabase. Возвращают доменные типы, ошибки переводят в `AppError` с понятным русским сообщением.
5. `lib/domain/` — чистые функции. Не импортируют React и Supabase, покрыты тестами Vitest.
6. Типы БД генерируются командой `supabase gen types typescript` в `lib/supabase/database.types.ts`. Доменные типы в `lib/domain/types.ts` выводятся из них.

**Структура папок**

```
.
├── .github/workflows/deploy.yml
├── docs/SPEC.md
├── supabase/
│   ├── config.toml
│   └── migrations/20261110194256_init.sql
├── public/.nojekyll
├── src/
│   ├── app/
│   │   ├── layout.tsx            # провайдеры: QueryClient, Theme, Auth
│   │   ├── page.tsx              # дашборд
│   │   ├── login/page.tsx
│   │   ├── areas/page.tsx        # разделы и их проекты
│   │   ├── area/page.tsx         # раздел по ?id=
│   │   ├── project/page.tsx      # проект по ?id=
│   │   ├── tasks/page.tsx        # все задачи + фильтры
│   │   ├── stats/page.tsx
│   │   └── settings/page.tsx     # теги, тема, демо-данные, выход
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   └── layout/               # AppShell, Sidebar, MobileNav, AuthGuard
│   ├── features/
│   │   ├── auth/                 # AuthProvider, LoginForm, useSession
│   │   ├── areas/                # api.ts, hooks.ts, components/
│   │   ├── projects/             # api.ts, hooks.ts, components/
│   │   ├── tasks/                # api.ts, hooks.ts, components/
│   │   ├── tags/                 # api.ts, hooks.ts, components/
│   │   ├── dashboard/            # components/
│   │   └── stats/                # api.ts, hooks.ts, components/
│   └── lib/
│       ├── supabase/             # client.ts, database.types.ts
│       ├── domain/               # types, progress, recurrence, stats, filters + *.test.ts
│       ├── query/                # queryClient.ts, queryKeys.ts
│       └── utils.ts
├── .env.example
└── README.md
```

## Модель данных (Supabase)

Пять таблиц, у каждой строки (кроме связки `task_tags`) есть владелец `user_id`; доступ ограничен RLS. Вся схема — в первой миграции `supabase/migrations/20261110194256_init.sql` (версия совпадает с записью в истории миграций облачной базы).

**Таблицы**

```sql
create type task_status   as enum ('todo', 'in_progress', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table areas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#6366f1',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  area_id     uuid not null references areas on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  color       text not null default '#6366f1',
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  project_id   uuid references projects on delete cascade,
  area_id      uuid references areas on delete cascade,     -- задача прямо в разделе, без проекта
                                                            -- оба null = «Входящие»
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  status       task_status   not null default 'todo',
  priority     task_priority not null default 'medium',
  due_date     date,
  completed_at timestamptz,
  recurrence   jsonb,  -- null = обычная задача
  series_id    uuid,   -- общий id всех экземпляров одной повторяющейся задачи
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (project_id is null or area_id is null),
  check (recurrence is null or due_date is not null),
  check (recurrence is null or recurrence->>'type' in ('daily', 'every_n_days', 'weekly', 'monthly'))
);

create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name    text not null check (char_length(name) between 1 and 40),
  color   text not null default '#64748b',
  unique (user_id, name)
);

create table task_tags (
  task_id uuid not null references tasks on delete cascade,
  tag_id  uuid not null references tags  on delete cascade,
  primary key (task_id, tag_id)
);
```

Индексы: `projects (area_id)`, `tasks (user_id, status)`, `tasks (project_id)`, `tasks (area_id)`, `tasks (user_id, due_date)`, `tasks (user_id, completed_at)`, `task_tags (tag_id)`.

**Формат правила повторения** (zod-схема на клиенте, CHECK в БД проверяет поле `type`)

```ts
type Recurrence =
  | { type: 'daily' }
  | { type: 'every_n_days'; interval: number }   // 2..365
  | { type: 'weekly'; weekdays: number[] }       // ISO: 1 = пн … 7 = вс, непустой
  | { type: 'monthly'; dayOfMonth: number };     // 1..31; если дней в месяце меньше — последний день
```

**Триггеры**

- `set_updated_at()` — before update на `areas`, `projects` и `tasks`.
- `sync_completed_at()` — before insert or update of status на `tasks`: статус стал `done` и `completed_at` пуст → `now()`; статус не `done` → `completed_at = null`.

**RLS**

- Включён на всех пяти таблицах. Политики только для роли `authenticated`; у `anon` доступа нет.
- `areas`, `tags`: `using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)`.
- `projects`: то же, плюс в `with check` раздел должен принадлежать пользователю: `exists (select 1 from areas a where a.id = area_id and a.user_id = (select auth.uid()))`.
- `tasks`: то же, плюс в `with check` проект и раздел (если указаны) должны принадлежать пользователю: `project_id is null or exists (select 1 from projects p where p.id = project_id and p.user_id = (select auth.uid()))` и аналогично для `area_id`.
- `task_tags`: доступ, только если и задача, и тег принадлежат пользователю (через `exists`).

**Представление прогресса**

```sql
create view project_progress with (security_invoker = true) as
select p.id as project_id,
       count(t.id) filter (where t.recurrence is null)                       as total,
       count(t.id) filter (where t.recurrence is null and t.status = 'done') as done
from projects p
left join tasks t on t.project_id = p.id
group by p.id;
```

```sql
-- задачи раздела = лежащие в нём напрямую + задачи его неархивных проектов
create view area_progress with (security_invoker = true) as
with area_tasks as (
  select t.area_id, t.status, t.recurrence
  from tasks t
  where t.area_id is not null
  union all
  select p.area_id, t.status, t.recurrence
  from tasks t
  join projects p on p.id = t.project_id
  where p.archived_at is null
)
select a.id as area_id,
       count(x.area_id) filter (where x.recurrence is null)                       as total,
       count(x.area_id) filter (where x.recurrence is null and x.status = 'done') as done
from areas a
left join area_tasks x on x.area_id = a.id
group by a.id;
```

На этапе 2 представление проверяется на данных: раздел без проектов, с задачами напрямую и в проектах, с архивным проектом.

`security_invoker = true` обязателен в обоих представлениях: без него представление обходит RLS. Процент считается на клиенте.

**RPC `complete_recurring_task(p_task_id uuid, p_next_due date) returns uuid`**

- `language plpgsql`, `security invoker`, `set search_path = ''`, таблицы с префиксом `public.`. Всё в одной транзакции.
- Блокирует строку (`for update`) и проверяет: задача принадлежит пользователю, `recurrence is not null`, статус не `done`, `p_next_due > due_date`. Иначе — исключение с понятным текстом.
- Ставит текущему экземпляру `status = 'done'` и `series_id = coalesce(series_id, id)`.
- Вставляет следующий экземпляр: те же `project_id`, `area_id`, `title`, `description`, `priority`, `recurrence`, `series_id`; `status = 'todo'`, `due_date = p_next_due`. Копирует строки `task_tags`. Возвращает id нового экземпляра.
- Дату `p_next_due` считает клиент функцией `getNextDueDate`: логика дат живёт в одном месте и покрыта тестами.
- Снятие отметки с выполненного экземпляра просто возвращает его в `todo` и не трогает уже созданный следующий.

## Доменная логика (`lib/domain/`)

Все расчёты — чистые функции с явным параметром `today`, чтобы тесты не зависели от текущей даты. Даты группируются по локальному часовому поясу браузера.

**`progress.ts`**

- `calcProgress(done, total)` → `{ done, total, percent }`, где `percent = total === 0 ? 0 : Math.round(done / total * 100)`.
- Проект или раздел без задач показывает «Нет задач», а не 0%.

**`location.ts`**

- `resolveAreaId(task, projectsById)` → раздел задачи: `task.area_id`, либо раздел её проекта, либо `null` для «Входящих». Используется фильтрами и статистикой по разделам.

**`recurrence.ts`**

- `getNextDueDate(rule, currentDue, today)` → первая дата по правилу, которая строго позже и `currentDue`, и `today`. Пропущенные периоды просроченной задачи не создаются.
- `daily` — следующий день; `every_n_days` — плюс `interval` дней; `weekly` — ближайший день из `weekdays`; `monthly` — указанное число следующего месяца, а если такого числа нет — последний день месяца.
- `describeRecurrence(rule)` → подпись для бейджа: «Каждый день», «Каждые 3 дня», «Пн, Ср, Пт», «Каждое 15-е число».
- Тесты: конец месяца (31 → февраль), високосный год, переход через воскресенье, просрочка на несколько периодов, выполнение раньше срока.

**`stats.ts`**

- `completedByDay(tasks, from, to)` → `[{ date, count }]`, дни без выполненных задач включены с нулём.
- `currentStreak(tasks, today)` → число дней подряд с хотя бы одной выполненной задачей. Если сегодня ещё ничего не выполнено, серия считается до вчерашнего дня и не обнуляется.
- `burndown(tasks, from, to)` → открытые задачи на конец каждого дня: `created_at ≤ конец дня` и (`completed_at` пуст или позже конца дня). Ограничение: удалённые задачи выпадают из истории — это допустимо.
- `countByStatus`, `countByPriority`, `completedByTag(tasks, from, to)`, `completedByArea(tasks, projectsById, from, to)`.
- KPI дашборда: выполнено сегодня, за 7 дней, в работе, просрочено, серия.

**`filters.ts`**

- `filterTasks(tasks, filters, today)` и `sortTasks(tasks, sort)`.
- `groupByDue(tasks, today)` → группы «Просрочено», «Сегодня», «Завтра», «На неделе», «Позже», «Без срока».
- Состояние фильтров хранится в query-параметрах URL, чтобы ссылку на отфильтрованный список можно было сохранить.

**Загрузка данных для статистики**

Один запрос задач за период (поля `id`, `project_id`, `area_id`, `status`, `priority`, `created_at`, `completed_at`, `due_date`, `recurrence` и теги), агрегация на клиенте функциями выше. Для одного пользователя это сотни или тысячи строк — отдельные SQL-агрегаты не нужны.

## Экраны и UI

Восемь экранов; главный — дашборд, который за пару секунд отвечает на вопрос «как у меня дела».

| Экран | Маршрут | Содержимое |
| --- | --- | --- |
| Вход | `/login` | Email и пароль, ошибки на русском |
| Дашборд | `/` | KPI-карточки; прогресс по разделам (полоса на каждый раздел); кольца прогресса активных проектов, сгруппированные по разделам; столбчатый график «Выполнено за 14 дней»; кольцевая диаграмма статусов; блоки «Сегодня и просрочено» и «Ближайшие 7 дней» |
| Разделы | `/areas` | Разделы с прогресс-баром и «7 из 10», под каждым — карточки его проектов (цвет, прогресс-бар, «7 из 10»); создание, редактирование, порядок и удаление разделов; создание и архивация проектов; переключатель «Показать архив» |
| Раздел | `/area/?id=` | Кольцо прогресса раздела, карточки его проектов, задачи раздела без проекта с фильтрами, быстрое добавление (задача создаётся прямо в разделе) |
| Проект | `/project/?id=` | Путь «Раздел → Проект», кольцо прогресса, burndown за 30 дней, задачи проекта с фильтрами, быстрое добавление |
| Задачи | `/tasks` | Все задачи, включая «Входящие»; фильтры в URL; группировка по сроку |
| Статистика | `/stats` | Период 7 / 30 / 90 дней; выполнено по дням; по разделам; по тегам; по приоритетам; burndown выбранного проекта; KPI |
| Настройки | `/settings` | Теги, тема, кнопка «Заполнить демо-данными» (только для пустого аккаунта), выход |

**Принципы интерфейса**

- Навигация: боковая панель на десктопе (под основными пунктами — список разделов со ссылками на `/area/?id=`), нижняя панель на мобильном.
- Создание задачи — строка быстрого добавления или диалог; редактирование — боковая панель (Sheet).
- Состояния: скелетоны при загрузке, пустые состояния с действием («Создайте первый проект»), toast на ошибки и успешные действия, подтверждение перед удалением.
- Цвета разделов, проектов и приоритетов одинаковы во всех списках и графиках. Графики берут цвета из CSS-переменных темы и корректно выглядят в тёмной теме.
- Даты в формате «20 окт», локаль `ru`, неделя начинается с понедельника.
- Доступность: работа с клавиатуры, `aria-label` на иконках-кнопках, достаточный контраст.
- Демо-данные: 3 раздела («Учёба», «Работа», «Личное»), 4 проекта, около 40 задач (часть — прямо в разделах и во «Входящих»), `completed_at` разбросаны по последним 30 дням (а `created_at` — раньше них), пара повторяющихся задач — чтобы сразу проверить графики.

## Деплой и настройка

Каждый push в `main` собирает сайт в GitHub Actions и публикует его на GitHub Pages. Ручные шаги ниже выполняю я — опиши их в `README.md` пошагово.

**Workflow `.github/workflows/deploy.yml`**

- Триггеры: `push` в `main` и `workflow_dispatch`.
- `permissions`: `contents: read`, `pages: write`, `id-token: write`; `concurrency` на группу `pages`.
- Job `build`: checkout → setup-node (LTS, кэш npm) → `npm ci` → `npm run lint` → `npm test` → `npm run build` → upload-pages-artifact из `./out`.
- Переменные сборки: `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` из GitHub Actions Variables, `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`.
- Job `deploy`: deploy-pages, окружение `github-pages`.
- В `public/` лежит пустой `.nojekyll`, чтобы папка `_next` не игнорировалась.

**Ручная настройка Supabase**

1. Создать проект на supabase.com.
2. Применить миграции: `supabase link --project-ref <ref>`, затем `supabase db push`.
3. Создать своего пользователя (email и пароль) в разделе Authentication.
4. Отключить регистрацию новых пользователей в настройках Authentication.
5. Указать Site URL — адрес сайта на GitHub Pages.
6. Скопировать Project URL и publishable (anon) ключ.

**Ручная настройка GitHub**

1. Settings → Pages → Source: GitHub Actions.
2. Settings → Secrets and variables → Actions → Variables: добавить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Сделать push в `main` и проверить сайт по адресу `https://<user>.github.io/<repo>/`.

**Локальная разработка**

- `.env.example` → копия `.env.local` с теми же переменными, `NEXT_PUBLIC_BASE_PATH` пустой.
- `npm run dev` — разработка; `npm run build` и локальный просмотр `out/` — проверка статического экспорта.
- Работаем с облачным проектом Supabase; локальный Supabase (`supabase start`, нужен Docker) не используется.
- Supabase CLI ставится как dev-зависимость и запускается через `npx supabase`.

## План работы

Девять этапов, каждый заканчивается рабочим приложением: lint, тесты и `npm run build` зелёные, изменения закоммичены. Деплой проверяется на первом же этапе, чтобы ограничения GitHub Pages всплыли сразу. Отмечай выполненные этапы в этом файле.

- [ ] **1. Каркас.** Next.js + TypeScript + Tailwind + shadcn/ui, ESLint и Prettier, Vitest, настройки статического экспорта, AppShell с навигацией и заглушками всех страниц, workflow деплоя. Готово, когда сайт открывается на GitHub Pages и навигация работает с `basePath`.
- [x] **2. База данных.** Миграция: типы, таблицы, индексы, триггеры, RLS, представления, RPC. Генерация типов, клиент Supabase. Готово, когда `supabase db push` проходит, а запрос без входа не видит ни одной строки.
- [x] **3. Авторизация.** `/login`, AuthProvider, AuthGuard, выход, редирект после входа. Готово, когда без входа доступна только `/login`.
- [x] **4. Разделы и проекты.** API, хуки, страницы `/areas` и `/area`, разделы в боковой панели; создание, редактирование, порядок и каскадное удаление разделов; создание, редактирование, перенос, архивация и удаление проектов; прогресс-бары из `area_progress` и `project_progress`; палитра цветов. Тесты `progress.ts`.
- [x] **5. Задачи и теги.** CRUD задач, выбор расположения (проект / раздел / «Входящие»), быстрое добавление, «Входящие», фильтры и сортировка в URL, группировка по сроку, управление тегами, optimistic смена статуса. Тесты `filters.ts` и `location.ts`.
- [ ] **6. Повторяющиеся задачи.** `recurrence.ts` с тестами, редактор правила в форме задачи, вызов RPC при выполнении, бейдж повтора.
- [ ] **7. Дашборд.** KPI-карточки, прогресс по разделам, кольца прогресса, график за 14 дней, диаграмма статусов, блоки сроков. Тесты `stats.ts`.
- [ ] **8. Статистика и страница проекта.** Выбор периода, burndown, разбивка по разделам, тегам и приоритетам.
- [ ] **9. Полировка.** Тёмная тема, мобильная вёрстка, пустые состояния, скелетоны, обработка ошибок, демо-данные, финальный README.

После каждого этапа — короткий отчёт: что сделано, как проверить руками, что дальше.

## Правила работы для Claude Code

Работай поэтапно и останавливайся после каждого этапа, чтобы я мог проверить результат.

1. Перед этапом кратко опиши план и список файлов, которые создашь или изменишь. Начинай после моего подтверждения.
2. Если требование неясно или противоречит ограничениям GitHub Pages — спроси, не придумывай.
3. Перед использованием библиотеки сверяйся с её актуальной документацией (статический экспорт Next.js, supabase-js, shadcn/ui, Recharts, TanStack Query).
4. TypeScript strict, без `any`. Данные из Supabase типизированы сгенерированными типами, пользовательский ввод проверяется zod.
5. Схему БД меняй только новыми файлами миграций; уже применённые миграции не редактируй.
6. Не коммить секреты: `.env.local` в `.gitignore`, ключ `service_role` не используется.
7. Не добавляй функциональность из раздела «Вне рамок». Если считаешь что-то полезным — предложи отдельно.
8. Имена в коде — на английском; тексты интерфейса — на русском; комментарии — на русском и только там, где логика неочевидна.
9. Коммиты в стиле Conventional Commits (`feat:`, `fix:`, `chore:`), небольшие и осмысленные.
10. В конце этапа lint, тесты и сборка должны проходить. Кратко объясни ключевые решения — я хочу понимать код, а не только получить результат.

## Изменения ТЗ

**10 ноября 2026**

- Добавлен третий уровень: «разделы → проекты → задачи». Новая таблица `areas`, у проекта обязательный `area_id`, у задачи необязательный `area_id` (задача прямо в разделе); представление `area_progress`; экраны `/areas` и `/area/?id=` вместо `/projects`; удаление раздела каскадное с подтверждением.
- Повторяющаяся задача, отмеченная `done` через выпадающий список, тоже идёт через RPC. Удаление повторяющейся задачи удаляет только текущий экземпляр.
- Burndown проекта не учитывает повторяющиеся задачи.
- Задачи архивных проектов скрыты из списков, сроков, KPI «в работе» / «просрочено» и прогресса раздела, но учитываются в истории.
- Цвета выбираются из фиксированной палитры.
- Работаем с облачным Supabase, без локального.
