type Item = {
  key: string;
  label: string;
  value: number;
  /** Цвет полосы — цвет сущности (раздела, тега, приоритета). */
  color: string;
};

type Props = {
  items: readonly Item[];
  /** Подпись для скринридера: «Выполнено по разделам». */
  label: string;
  emptyText: string;
};

/**
 * Горизонтальные полосы «название — полоса — число». Значение всегда
 * подписано текстом, поэтому цвет не единственный носитель смысла и
 * подсказка при наведении не нужна.
 */
export function BarList({ items, label, emptyText }: Props) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0 || max === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate" title={item.label}>
              {item.label}
            </span>
          </span>
          <span className="h-3 overflow-hidden rounded-r bg-muted" aria-hidden>
            <span
              className="block h-full rounded-r transition-[width] duration-500 motion-reduce:transition-none"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </span>
          <span className="w-8 text-right font-medium tabular-nums">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
