/** Элемент со своим порядком: меньше sort_order — выше. */
type Ordered = { id: string; sort_order: number };

/** Шаг между задачами при перенумерации и при переносе в начало или конец. */
export const ORDER_STEP = 1000;

/**
 * Меньше такого зазора между соседями середину брать нельзя: sort_order —
 * это миллисекунды (около 1,7·10¹²), и у double на таких числах точность
 * порядка 0,0004. Задачи, созданные одним запросом, стоят ближе 1 мс друг
 * к другу, поэтому запас берём с большим отрывом.
 */
export const MIN_GAP = 0.01;

/** Порядок «Свой порядок»: по sort_order, при равных — по дате создания. */
export function byManualOrder<
  T extends Pick<Ordered, "sort_order"> & { created_at: string },
>(a: T, b: T): number {
  return (
    a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  );
}

function move<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

/**
 * Какие sort_order записать, чтобы задача activeId встала на место overId
 * в показанном списке (он уже отсортирован по своему порядку).
 *
 * Обычно меняется одна задача: ей ставится значение между новыми соседями.
 * Если соседи слишком близко, весь список перенумеровывается с шагом
 * ORDER_STEP — тогда возвращаются все изменившиеся задачи.
 */
export function planMove(
  items: readonly Ordered[],
  activeId: string,
  overId: string,
): Ordered[] {
  const from = items.findIndex((t) => t.id === activeId);
  const to = items.findIndex((t) => t.id === overId);
  if (from === -1 || to === -1 || from === to) return [];

  const reordered = move(items, from, to);
  const prev = reordered[to - 1];
  const next = reordered[to + 1];

  let value: number;
  if (prev && next) {
    if (next.sort_order - prev.sort_order < MIN_GAP) {
      return renumber(reordered);
    }
    value = (prev.sort_order + next.sort_order) / 2;
  } else if (next) {
    value = next.sort_order - ORDER_STEP;
  } else if (prev) {
    value = prev.sort_order + ORDER_STEP;
  } else {
    return [];
  }
  return [{ id: activeId, sort_order: value }];
}

/** Равномерно расставляет список, начиная с наименьшего значения. */
function renumber(items: readonly Ordered[]): Ordered[] {
  const base = Math.min(...items.map((t) => t.sort_order));
  return items
    .map((t, i) => ({
      id: t.id,
      sort_order: base + i * ORDER_STEP,
      old: t.sort_order,
    }))
    .filter(({ sort_order, old }) => sort_order !== old)
    .map(({ id, sort_order }) => ({ id, sort_order }));
}

/** Применяет изменения порядка к списку задач (для мгновенного обновления кэша). */
export function applyOrder<T extends Ordered>(
  tasks: readonly T[],
  updates: readonly Ordered[],
): T[] {
  const byId = new Map(updates.map((u) => [u.id, u.sort_order]));
  return tasks.map((t) =>
    byId.has(t.id) ? { ...t, sort_order: byId.get(t.id)! } : t,
  );
}
