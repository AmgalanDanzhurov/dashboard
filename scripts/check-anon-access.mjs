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

/**
 * «закрыто» — Postgres отказал в доступе (код 42501) или вернул пустой список.
 * Любой другой ответ — например, 401 из-за неверного ключа или 404 из-за
 * неприменённой миграции — значит, что проверить не удалось.
 */
async function classify(res) {
  const body = await res.text();
  if (res.ok && body.trim() === "[]") return "закрыто";
  try {
    if (JSON.parse(body).code === "42501") return "закрыто";
  } catch {
    // не JSON — разберём ниже как непроверенное
  }
  if (res.ok) return "ОТКРЫТО";
  return `НЕ ПРОВЕРЕНО: ${body.slice(0, 120)}`;
}

let failed = false;

for (const name of relations) {
  const res = await fetch(`${url}/rest/v1/${name}?select=*&limit=1`, {
    headers,
  });
  const verdict = await classify(res);
  console.log(`${verdict}  ${name}  (HTTP ${res.status})`);
  if (verdict !== "закрыто") failed = true;
}

const rpc = await fetch(`${url}/rest/v1/rpc/complete_recurring_task`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    p_task_id: "00000000-0000-4000-8000-000000000000",
    p_next_due: "2099-01-01",
  }),
});
const rpcVerdict = await classify(rpc);
console.log(`${rpcVerdict}  rpc/complete_recurring_task  (HTTP ${rpc.status})`);
if (rpcVerdict !== "закрыто") failed = true;

if (failed) {
  console.error("\nПроверка не пройдена: см. строки выше.");
  process.exit(1);
}
console.log("\nБез входа данные недоступны.");
