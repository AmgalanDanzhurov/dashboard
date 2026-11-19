type DataErrorLike = { code?: string; message?: string };

type Page<T> = { data: T[] | null; error: DataErrorLike | null };

/**
 * Supabase отдаёт не больше 1000 строк за запрос (настройка Max rows), и
 * лишнее молча отрезает. Эта функция читает страницами, пока не придёт
 * неполная страница. Запрос должен быть упорядочен однозначно (с id в
 * конце), иначе строки на границах страниц могут повториться или пропасть.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<Page<T>>,
  pageSize = 1000,
): Promise<{ data: T[]; error: DataErrorLike | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}
