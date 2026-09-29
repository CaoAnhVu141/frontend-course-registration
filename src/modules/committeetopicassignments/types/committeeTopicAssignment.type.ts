export type CommitteeTopicAssignmentStatus =
  | 'ASSIGNED'
  | 'COMPLETED'
  | 'CANCELED'

export type CommitteeTopicAssignment = {
  id: number
  defenseCommitteeId: number
  defenseCommitteeCode: string
  defenseCommitteeName: string
  registrationPeriodId: number
  topicRegistrationId: number
  topicId: number
  topicTitle: string
  studentGroupId: number
  studentGroupName: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  room?: string | null
  status: CommitteeTopicAssignmentStatus
  assignedBy: string
  assignedAt: string
}

export type CreateCommitteeTopicAssignmentRequest = {
  defenseCommitteeId?: number
  topicRegistrationId?: number
  scheduledStart?: string
  scheduledEnd?: string
  room?: string
}

export type UpdateDefenseScheduleRequest = {
  scheduledStart: string
  scheduledEnd: string
  room: string
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
