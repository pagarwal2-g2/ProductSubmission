type Status = 'pending' | 'approved' | 'rejected'

export default function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }
  return (
    <span className={cls[status] || 'badge-pending'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
