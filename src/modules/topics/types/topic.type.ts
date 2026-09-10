export type TopicStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'CLOSED'

export type Topic = {
  id: number
  title: string
  requirements?: string
  departmentId: number
  registrationPeriodId: number
  proposedBy: string
  status: TopicStatus
  supervisorIds: number[]
  rejectionReason?: string | null
}

export type TopicRequest = {
  title: string
  requirements?: string
  departmentId?: number
  registrationPeriodId?: number
}

export type ApiResponse<T> = {
  timestamp: string
  status: number
  message: string
  data: T
}
