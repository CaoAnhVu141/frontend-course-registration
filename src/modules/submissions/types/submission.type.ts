export type SubmissionVersion = {
  id: number
  submissionId: number
  fileName: string
  storageKey: string
  mimeType: string
  fileSize: number
  changeNote?: string | null
  uploadedBy: string
}

export type Submission = {
  id: number
  topicRegistrationId: number
  status: boolean
  submittedAt: string
  submissionVersions: SubmissionVersion[]
}

export type SubmissionFeedback = {
  id: number
  submissionVersionId: number
  lecturerUserId: number
  lecturerName?: string
  lecturerEmail: string
  lecturerCode: string
  comment: string
}

export type CreateSubmissionRequest = {
  topicRegistrationId?: number
}

export type CreateSubmissionVersionRequest = {
  submissionId?: number
  fileName: string
  storageKey: string
  mimeType: string
  fileSize?: number
  changeNote?: string
}

export type CreateSubmissionFeedbackRequest = {
  submissionVersionId?: number
  comment: string
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
