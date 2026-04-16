interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

const colorMap = {
  blue:   { bg: 'bg-blue-600/10',   icon: 'text-blue-400',   border: 'border-blue-600/20' },
  green:  { bg: 'bg-green-600/10',  icon: 'text-green-400',  border: 'border-green-600/20' },
  red:    { bg: 'bg-red-600/10',    icon: 'text-red-400',    border: 'border-red-600/20' },
  yellow: { bg: 'bg-yellow-600/10', icon: 'text-yellow-400', border: 'border-yellow-600/20' },
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`card border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center text-2xl ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}