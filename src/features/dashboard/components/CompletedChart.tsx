"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDue } from "@/lib/domain/dates";
import { plural, TASK_FORMS } from "@/lib/domain/plural";
import type { ISODate } from "@/lib/domain/types";

const config = {
  count: { label: "Выполнено", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Props = {
  days: { date: ISODate; count: number }[];
  today: ISODate;
  title?: string;
};

/** Столбчатый график «Выполнено по дням»: одна серия, легенда не нужна. */
export function CompletedChart({
  days,
  today,
  title = "Выполнено за 14 дней",
}: Props) {
  const headingId = useId();
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const data = days.map((d) => ({
    ...d,
    // На коротком периоде на оси — число месяца, на длинном — «16 ноя».
    day:
      days.length <= 14
        ? String(Number(d.date.slice(8, 10)))
        : formatDue(d.date, today),
    label: d.date === today ? "Сегодня" : formatDue(d.date, today),
  }));

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-medium">
          {title}
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total} {plural(total, TASK_FORMS)}
        </span>
      </div>

      <ChartContainer
        config={config}
        className="aspect-auto h-48 w-full"
        aria-hidden
      >
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelKey="label"
                labelFormatter={(_, payload) =>
                  payload[0]?.payload?.label ?? ""
                }
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ChartContainer>

      {/* Те же данные для скринридера: график выше — только картинка. */}
      {/* sr-only на обёртке: у самой таблицы height: 1px не работает —
          таблица растягивается под строки и удлиняет страницу. */}
      <div className="sr-only">
        <table>
          <caption>Выполнено задач по дням</caption>
          <thead>
            <tr>
              <th scope="col">День</th>
              <th scope="col">Выполнено</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{d.label}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
