export type TopicRegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type TopicRegistration = {
  id: number
  studentGroupId: number
  studentGroupName: string
  topicId: number
  topicTitle: string
  status: TopicRegistrationStatus
  registeredBy: string
  registeredAt: string
  decidedBy?: string | null
  rejectionReason?: string | null
}

export type CreateTopicRegistrationRequest = {
  studentGroupId?: number
  topicId?: number
}

export type RejectTopicRegistrationRequest = {
  rejectionReason: string
}

export type ApiResponse<T> = {
  timestamp?: string
  code?: number
  status?: number
  message: string
  data: T
}
