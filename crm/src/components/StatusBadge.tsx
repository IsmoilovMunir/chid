import type { ClientStatus } from '../types/crm'
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from '../constants/labels'

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CLIENT_STATUS_COLORS[status]}`}>
      {CLIENT_STATUS_LABELS[status]}
    </span>
  )
}
