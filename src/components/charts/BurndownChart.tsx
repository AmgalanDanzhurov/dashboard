"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDue } from "@/lib/domain/dates";
import type { ISODate } from "@/lib/domain/types";

const config = {
  open: { label: "Открыто задач", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Props = {
  points: { date: ISODate; open: number }[];
  today: ISODate;
};

/**
 * Burndown: сколько задач оставалось открытыми на конец каждого дня.
 * Одна серия — линия 2px и лёгкая заливка; подсказка с перекрестьем.
 */
export function BurndownChart({ points, today }: Props) {
  const data = points.map((p) => ({
    ...p,
    label: p.date === today ? "Сегодня" : formatDue(p.date, today),
  }));
  const last = data[data.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer
        config={config}
        className="aspect-auto h-48 w-full"
        aria-hidden
      >
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <ChartTooltip
            cursor={{ strokeWidth: 1 }}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="open"
            type="linear"
            stroke="var(--color-open)"
            strokeWidth={2}
            fill="var(--color-open)"
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </AreaChart>
      </ChartContainer>
      {last ? (
        // Значение на конце линии — текстом, а не только на графике.
        <p className="text-sm text-muted-foreground">
          Сейчас открыто:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {last.open}
          </span>
        </p>
      ) : null}
      <table className="sr-only">
        <caption>Открытые задачи на конец дня</caption>
        <thead>
          <tr>
            <th scope="col">День</th>
            <th scope="col">Открыто</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{d.open}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
