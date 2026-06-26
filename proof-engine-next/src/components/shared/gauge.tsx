export function Gauge({
  value,
  size = 88,
  stroke = 8,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-semibold">{value}%</span>
        {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}
