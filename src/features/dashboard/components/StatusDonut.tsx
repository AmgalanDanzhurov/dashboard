"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { statuses } from "@/lib/domain/taskMeta";
import type { TaskStatus } from "@/lib/domain/types";

// Порядок и цвета фиксированы: «Готово» всегда одного цвета, сколько бы
// статусов ни было на экране. Цвета проверены валидатором палитры.
const config = {
  todo: { label: "К выполнению", color: "var(--chart-1)" },
  in_progress: { label: "В работе", color: "var(--chart-2)" },
  done: { label: "Готово", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Кольцевая диаграмма статусов с легендой и числами рядом с каждым цветом. */
export function StatusDonut({
  counts,
}: {
  counts: Record<TaskStatus, number>;
}) {
  const total = counts.todo + counts.in_progress + counts.done;
  const data = statuses.map((s) => ({
    status: s.value,
    count: counts[s.value],
    fill: `var(--color-${s.value})`,
  }));

  return (
    <section
      aria-labelledby="status-heading"
      className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <h2 id="status-heading" className="font-medium">
        Задачи по статусам
      </h2>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Задач пока нет.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative size-40 shrink-0">
            <ChartContainer
              config={config}
              className="aspect-square size-40"
              aria-hidden
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="status" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={52}
                  outerRadius={72}
                  // Зазор цвета фона между сегментами вместо обводки.
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {data.map((d) => (
                    <Cell key={d.status} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">
                {total}
              </span>
              <span className="text-xs text-muted-foreground">всего</span>
            </div>
          </div>

          {/* Легенда с числами: цвет никогда не единственный носитель смысла. */}
          <ul className="flex flex-col gap-2 text-sm">
            {data.map((d) => (
              <li key={d.status} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground">
                  {config[d.status].label}
                </span>
                <span className="ml-auto pl-4 font-medium tabular-nums">
                  {d.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
