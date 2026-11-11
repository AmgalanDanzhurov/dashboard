"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  activeFilterCount,
  defaultFilters,
  type DueFilter,
  type TaskFilters,
  type TaskSort,
} from "@/lib/domain/filters";
import { priorities, statuses } from "@/lib/domain/taskMeta";

import type { TaskData } from "../useTaskData";

import { MultiSelectMenu } from "./MultiSelectMenu";

// В Radix Select нельзя выбрать пустую строку — «все» обозначаем отдельно.
const ALL = "all";

const dueOptions: { value: DueFilter; label: string }[] = [
  { value: "overdue", label: "Просрочено" },
  { value: "today", label: "Сегодня" },
  { value: "week", label: "7 дней" },
  { value: "none", label: "Без срока" },
];

const sortOptions: { value: TaskSort; label: string }[] = [
  { value: "due", label: "По сроку" },
  { value: "priority", label: "По приоритету" },
  { value: "created", label: "Сначала новые" },
];

type Props = {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  data: TaskData;
};

export function TaskFiltersBar({ filters, onChange, data }: Props) {
  const set = (patch: Partial<TaskFilters>) =>
    onChange({ ...filters, ...patch });

  // Поиск пишем в URL с задержкой, а не на каждую букву.
  const [q, setQ] = useState(filters.q);
  useEffect(() => {
    if (q === filters.q) return;
    const timer = setTimeout(() => set({ q }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- реагируем только на ввод
  }, [q]);

  const projectOptions = data.projects.filter(
    (p) =>
      (p.archived_at === null || p.id === filters.project) &&
      (!filters.area || filters.area === "inbox" || p.area_id === filters.area),
  );
  const hasFilters = activeFilterCount(filters) > 0 || filters.q !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.area ?? ALL}
          onValueChange={(v) =>
            // Проект из другого раздела сбрасываем.
            set({ area: v === ALL ? null : v, project: null })
          }
        >
          <SelectTrigger size="sm" aria-label="Раздел">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все разделы</SelectItem>
            <SelectItem value="inbox">Входящие</SelectItem>
            <SelectSeparator />
            {data.areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.area !== "inbox" && projectOptions.length > 0 ? (
          <Select
            value={filters.project ?? ALL}
            onValueChange={(v) => set({ project: v === ALL ? null : v })}
          >
            <SelectTrigger size="sm" aria-label="Проект">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все проекты</SelectItem>
              {projectOptions.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <MultiSelectMenu
          label="Статус"
          options={statuses}
          value={filters.status}
          onChange={(status) => set({ status })}
        />
        <MultiSelectMenu
          label="Приоритет"
          options={priorities}
          value={filters.priority}
          onChange={(priority) => set({ priority })}
        />
        {data.tags.length > 0 ? (
          <MultiSelectMenu
            label="Теги"
            options={data.tags.map((t) => ({
              value: t.id,
              label: t.name,
              color: t.color,
            }))}
            value={filters.tags}
            onChange={(tags) => set({ tags })}
          />
        ) : null}

        <Select
          value={filters.due ?? ALL}
          onValueChange={(v) =>
            set({ due: v === ALL ? null : (v as DueFilter) })
          }
        >
          <SelectTrigger size="sm" aria-label="Срок">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Любой срок</SelectItem>
            {dueOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => set({ sort: v as TaskSort })}
        >
          <SelectTrigger size="sm" aria-label="Сортировка">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              onChange({ ...defaultFilters, sort: filters.sort });
            }}
          >
            <X aria-hidden /> Сбросить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
