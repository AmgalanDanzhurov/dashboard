# Дашборд задач

Личный дашборд задач: разделы → проекты → задачи, прогресс по количеству выполненных задач, графики.
Статический сайт на Next.js, публикуется на GitHub Pages; данные и вход — Supabase.

Полное ТЗ и план работы: [docs/SPEC.md](docs/SPEC.md).

> Черновик. Полная инструкция по настройке Supabase появится на этапе 2, финальная версия README — на этапе 9.

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
