"use client"

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ExperimentMetricPoint } from "@/lib/mock/types"

const config = {
  value: { label: "Variation", color: "var(--chart-1)" },
  baseline: { label: "Référence", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function ExperimentChart({ data, unit }: { data: ExperimentMetricPoint[]; unit: string }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={36} fontSize={12} unit={unit} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="url(#fillValue)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="baseline"
          stroke="var(--color-baseline)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
