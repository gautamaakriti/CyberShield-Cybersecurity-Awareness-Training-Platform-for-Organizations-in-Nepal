type BadgeVariant = 'passed' | 'failed' | 'pending' | 'watching' | 'active' | 'inactive'

const variants: Record<BadgeVariant, string> = {
  passed:   'bg-green-600/20 text-green-400 border-green-600/30',
  failed:   'bg-red-600/20 text-red-400 border-red-600/30',
  pending:  'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  watching: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  active:   'bg-green-600/20 text-green-400 border-green-600/30',
  inactive: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
}

const labels: Record<BadgeVariant, string> = {
  passed: 'Passed', failed: 'Failed', pending: 'Pending',
  watching: 'In Progress', active: 'Active', inactive: 'Inactive',
}

export default function Badge({ variant }: { variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {labels[variant]}
    </span>
  )
}