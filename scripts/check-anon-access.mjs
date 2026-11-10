// Проверяет снаружи, через REST API Supabase, что без входа (с публичным ключом)
// не видно ни одной строки и нельзя вызвать RPC. Ничего не записывает.
// Запуск: npm run db:check-anon (берёт переменные из .env.local)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local",
  );
  process.exit(1);
}

const headers = { apikey: key, "Content-Type": "application/json" };
const relations = [
  "areas",
  "projects",
  "tasks",
  "tags",
  "task_tags",
  "area_progress",
  "project_progress",
];

let failed = false;

for (const name of relations) {
  const res = await fetch(`${url}/rest/v1/${name}?select=*&limit=1`, {
    headers,
  });
  const body = await res.text();
  // Доступ закрыт, если в нём отказано или вернулся пустой список.
  // 404 и прочие ошибки — не «закрыто», а «не проверено» (например, миграция не применена).
  const closed =
    res.status === 401 ||
    res.status === 403 ||
    (res.ok && body.trim() === "[]");
  console.log(
    `${closed ? "закрыто" : "ОТКРЫТО"}  ${name}  (HTTP ${res.status})`,
  );
  if (!closed) failed = true;
}

const rpc = await fetch(`${url}/rest/v1/rpc/complete_recurring_task`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    p_task_id: "00000000-0000-4000-8000-000000000000",
    p_next_due: "2099-01-01",
  }),
});
const rpcClosed = rpc.status === 401 || rpc.status === 403;
console.log(
  `${rpcClosed ? "закрыто" : "ОТКРЫТО"}  rpc/complete_recurring_task  (HTTP ${rpc.status})`,
);
if (!rpcClosed) failed = true;

if (failed) {
  console.error("\nБез входа доступно то, что должно быть закрыто.");
  process.exit(1);
}
console.log("\nБез входа данные недоступны.");
