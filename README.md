# Дашборд задач

Личный дашборд задач: разделы → проекты → задачи, прогресс по количеству выполненных задач, графики.
Статический сайт на Next.js, публикуется на GitHub Pages; данные и вход — Supabase.

Полное ТЗ и план работы: [docs/SPEC.md](docs/SPEC.md).

> Черновик, финальная версия README — на этапе 9.

## Supabase

Работаем с облачным проектом; локальный Supabase не нужен. CLI стоит в dev-зависимостях и запускается через `npx supabase`.

1. Создайте проект на [supabase.com](https://supabase.com) и сохраните пароль базы в менеджере паролей.
2. Войдите в CLI и привяжите проект (`<ref>` — часть адреса проекта `https://supabase.com/dashboard/project/<ref>`):

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   ```

3. Примените миграции и проверьте схему:

   ```bash
   npm run db:push
   npm run db:test
   ```

   `db:test` выполняет [supabase/tests/database.test.sql](supabase/tests/database.test.sql) в транзакции с откатом: проверяет RLS, прогресс разделов и проектов, триггеры и RPC. В базе после него ничего не остаётся.

4. Сгенерируйте типы TypeScript: `npm run db:types`.
5. Project Settings → API: скопируйте Project URL и publishable (anon) ключ в `.env.local`.
6. Убедитесь, что без входа данные не видны: `npm run db:check-anon`.
7. Authentication → Users: создайте своего пользователя (email и пароль).
8. Authentication → Sign In / Providers: отключите регистрацию новых пользователей.

Схема меняется только новыми файлами в `supabase/migrations/`; уже применённые миграции не редактируются.

## Локальная разработка

Нужен Node.js 24 или новее.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Сайт откроется на http://localhost:3000.

| Команда             | Что делает                  |
| ------------------- | --------------------------- |
| `npm run dev`       | Сервер разработки           |
| `npm run build`     | Статическая сборка в `out/` |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | Проверка типов TypeScript   |
| `npm test`          | Тесты Vitest                |
| `npm run format`    | Форматирование Prettier     |

### Проверить сборку так, как её увидит GitHub Pages

Сайт на GitHub Pages живёт по адресу `/<имя репозитория>/`, поэтому собираем с `basePath` и раздаём папку под этим путём:

```bash
NEXT_PUBLIC_BASE_PATH=/dashboard npm run build
mkdir -p .preview && rm -rf .preview/dashboard && cp -r out .preview/dashboard
npx serve .preview
```

Затем откройте http://localhost:3000/dashboard/.

Особенности Windows:

- В Git Bash добавьте `MSYS_NO_PATHCONV=1` перед первой командой, иначе `/dashboard` превратится в путь вида `C:/Program Files/Git/dashboard`.
- Next.js 16.4 при сборке на Windows кладёт файлы предзагрузки страниц (`__next.*.txt`) во вложенные папки, а браузер ищет их одним файлом. Поэтому в консоли видны ошибки 404, хотя переходы работают. При сборке в GitHub Actions (Linux) этой проблемы нет.

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub (на бесплатном плане — публичный) и отправьте в него ветку `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → вкладка **Variables**: добавьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` (до этапа 2 можно оставить пустыми).
4. Каждый push в `main` запускает workflow `Deploy to GitHub Pages`: lint, проверка типов, тесты, сборка, публикация.
5. Сайт: `https://<user>.github.io/<repo>/`.
