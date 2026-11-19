"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseSort,
  sortLabels,
  sortValues,
  type TaskSort,
} from "@/lib/domain/filters";

/** Сортировка в адресе (?sort=), остальные параметры (?id=) сохраняются. */
export function useSortParam(fallback: TaskSort = "due") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sort = parseSort(params.get("sort")) ?? fallback;

  function setSort(next: TaskSort) {
    const query = new URLSearchParams(params.toString());
    if (next === fallback) query.delete("sort");
    else query.set("sort", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return [sort, setSort] as const;
}

/** Как распределять задачи по выбранной сортировке. */
export function groupingFor(
  sort: TaskSort,
  dueGrouping: "due" | "today",
): "due" | "today" | "none" | "manual" {
  if (sort === "manual") return "manual";
  return sort === "due" ? dueGrouping : "none";
}

export function SortSelect({
  value,
  onChange,
}: {
  value: TaskSort;
  onChange: (sort: TaskSort) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(parseSort(v) ?? "due")}
    >
      <SelectTrigger size="sm" aria-label="Сортировка">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortValues.map((v) => (
          <SelectItem key={v} value={v}>
            {sortLabels[v]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
