interface ProgressBarProps {
  value: number      // 0-100
  label?: string
  color?: 'blue' | 'green' | 'red'
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, label, color = 'blue', size = 'md' }: ProgressBarProps) {
  const colorMap = { blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500' }
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full ${h}`}>
        <div
          className={`${colorMap[color]} ${h} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}