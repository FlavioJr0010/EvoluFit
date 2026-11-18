"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate, formatDateShort } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

export type ChartSeries = {
  key: string;
  label: string;
  kind: "line" | "bar";
  color: string;
  dashed?: boolean;
  /** Barras com o mesmo stackId são empilhadas. */
  stackId?: string;
};

export type ChartPoint = { date: string } & Record<string, number | null | string>;

/**
 * Gráfico por data (linhas e/ou barras). Recebe só dados serializáveis
 * para poder ser usado a partir de Server Components.
 */
export function TimeChart({
  data,
  series,
  unit,
  digits = 1,
  height = 240,
  zeroBased = false,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  unit: string;
  digits?: number;
  height?: number;
  zeroBased?: boolean;
}) {
  const format = (value: unknown) =>
    typeof value === "number" ? `${formatNumber(value, digits)} ${unit}` : "—";

  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Gráfico: ${series.map((s) => s.label).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDateShort(d)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={zeroBased ? [0, "auto"] : ["auto", "auto"]}
            tickFormatter={(v: number) => formatNumber(v, 1)}
          />
          <Tooltip
            labelFormatter={(d) => formatDate(String(d))}
            formatter={(value, name) => [format(value), name]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s) =>
            s.kind === "bar" ? (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                stackId={s.stackId}
                radius={s.stackId ? undefined : [4, 4, 0, 0]}
                maxBarSize={28}
              />
            ) : (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type="monotone"
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "6 4" : undefined}
                dot={data.length <= 31 ? { r: 3 } : false}
                connectNulls
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
