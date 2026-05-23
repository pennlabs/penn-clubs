/**
 * Club status categories for approval workflow
 * These constants determine UI behavior (button labels, colors, icons)
 * The backend handles the actual business logic for each status
 */

export const APPROVE_STATUSES = ['FULL', 'PRELIMINARY', 'PROVISIONAL']
export const REJECT_STATUSES = ['SUSPENDED', 'TEMPORARY', 'INACTIVE']
export const DELETE_STATUSES = ['DEFUNCT']
export const UNDER_REVIEW_STATUS = 'UNDER REVIEW' // Set automatically, not user-selectable

/**
 * Helper to determine action type from status name
 * @param statusName - Status name (case-insensitive)
 */
export const getStatusActionType = (
  statusName: string,
): 'approve' | 'reject' | 'delete' | null => {
  const normalized = statusName.toUpperCase()

  if (DELETE_STATUSES.includes(normalized)) return 'delete'
  if (APPROVE_STATUSES.includes(normalized)) return 'approve'
  if (REJECT_STATUSES.includes(normalized)) return 'reject'

  return null
}

export type StatusActionInfo = {
  action: 'approve' | 'reject' | 'delete'
  label: string
  buttonClass: string
  icon: string
}

/**
 * Get UI action info (button styling, label, icon) based on status
 * @param statusName - Status name (case-insensitive, required)
 */
export const getStatusActionInfo = (statusName: string): StatusActionInfo => {
  const normalized = statusName.toUpperCase()

  if (DELETE_STATUSES.includes(normalized)) {
    return {
      action: 'delete',
      label: 'Delete',
      buttonClass: 'is-danger',
      icon: 'trash',
    }
  }

  if (APPROVE_STATUSES.includes(normalized)) {
    return {
      action: 'approve',
      label: 'Approve',
      buttonClass: 'is-success',
      icon: 'check',
    }
  }

  if (REJECT_STATUSES.includes(normalized)) {
    return {
      action: 'reject',
      label: 'Reject',
      buttonClass: 'is-danger',
      icon: 'x',
    }
  }

  // Fallback for unknown statuses (shouldn't happen with filtered list)
  return {
    action: 'approve',
    label: 'Approve',
    buttonClass: 'is-success',
    icon: 'check',
  }
}
