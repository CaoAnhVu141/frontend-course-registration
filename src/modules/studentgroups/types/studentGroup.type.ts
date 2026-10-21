export type GroupMemberRole = 'LEADER' | 'MEMBER'

export type GroupMember = {
  userId: number
  username: string
  name: string | null
  studentCode: string
  role: GroupMemberRole
  joinedAt: string
}

export type StudentGroup = {
  id: number
  registrationPeriodId: number
  name: string
  status: boolean
  createdBy: string
  members: GroupMember[]
}

export type CreateStudentGroupRequest = {
  registrationPeriodId?: number
  name: string
  memberUserIds: number[]
}

export type ApiResponse<T> = {
  timestamp?: string
  code?: number
  status?: number
  message: string
  data: T
}
