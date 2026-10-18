export type FinalResult = {
  id: number
  assignmentId: number
  topicId: number
  topicTitle: string
  studentGroupId: number
  studentGroupName: string
  finalScore: number
  published: boolean
  publishedBy?: string | null
  publishedAt?: string | null
}

export type PeriodFinalResult = {
  registrationPeriodId: number
  result: FinalResult
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
