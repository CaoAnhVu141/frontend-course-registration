export type DefenseCommitteeStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED'

export type CommitteeRole = 'MEMBER' | 'REVIEWER' | 'CHAIRMAN' | 'SECRETARY'

export type CommitteeMember = {
  id: number
  lecturerId: number
  lecturerName?: string | null
  lecturerCode: string
  lecturerEmail: string
  committeeRole: CommitteeRole
  joinedAt: string
}

export type DefenseCommittee = {
  id: number
  registrationPeriodId: number
  code: string
  name: string
  status: DefenseCommitteeStatus
  createdBy: string
  committeeMembers: CommitteeMember[]
}

export type CreateDefenseCommitteeRequest = {
  registrationPeriodId?: number
  code: string
  name: string
}

export type AddCommitteeMemberRequest = {
  lecturerId?: number
  committeeRole?: CommitteeRole
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
