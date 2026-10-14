export type EvaluationStatus = 'SUBMITTED'

export type Evaluation = {
  id: number
  assignmentId: number
  lecturerUserId: number
  lecturerCode: string
  lecturerEmail: string
  score: number
  comment?: string | null
  status: EvaluationStatus
  submittedAt: string
}

export type FinalResult = {
  id: number
  assignmentId: number
  topicId: number
  topicTitle: string
  studentGroupId: number
  studentGroupName: string
  finalScore?: number | null
  published: boolean
  publishedBy?: string | null
  publishedAt?: string | null
  evaluations: Evaluation[]
}

export type CreateEvaluationRequest = {
  assignmentId: number
  score: number
  comment?: string
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
