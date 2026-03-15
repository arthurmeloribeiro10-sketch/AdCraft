
interface ScoreRingProps {
  score: number
  size?: number
}

function getColor(score: number): string {
  if (score < 40) return '#ef4444' // red
  if (score < 60) return '#f59e0b' // yellow
  if (score < 75) return '#22d3ee' // cyan
  return '#22c55e' // green
}

export default function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedScore / 100) * circumference
  const color = getColor(clampedScore)
  const center = size / 2
  const fontSize = size * 0.22

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'none' }}
      >
        <span
          className="font-bold leading-none"
          style={{ fontSize: `${fontSize}px`, color }}
        >
          {clampedScore}
        </span>
        <span className="text-[#6b6b8a] mt-0.5" style={{ fontSize: `${fontSize * 0.45}px` }}>
          / 100
        </span>
      </div>
    </div>
  )
}
