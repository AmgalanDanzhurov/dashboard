/** Элемент, у которого есть порядковый номер (например, раздел). */
type Positioned = { id: string; position: number };

/**
 * Перемещает элемент на одну позицию вверх или вниз и возвращает,
 * какие позиции нужно сохранить. Позиции перенумеровываются 0, 1, 2…,
 * поэтому порядок чинится, даже если в базе были одинаковые номера.
 * Если двигать некуда, возвращает пустой список.
 */
export function moveByOne<T extends Positioned>(
  items: readonly T[],
  id: string,
  direction: "up" | "down",
): { id: string; position: number }[] {
  const from = items.findIndex((item) => item.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= items.length) return [];

  const reordered = [...items];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

  return reordered
    .map((item, index) => ({
      id: item.id,
      position: index,
      old: item.position,
    }))
    .filter(({ position, old }) => position !== old)
    .map(({ id: itemId, position }) => ({ id: itemId, position }));
}

/** Порядок по position, при равных — по дате создания. */
export function byPosition<T extends Positioned & { created_at: string }>(
  a: T,
  b: T,
): number {
  return a.position - b.position || a.created_at.localeCompare(b.created_at);
}
