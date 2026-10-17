import { apiClient } from '../../../shared/services/apiClient'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import type {
  ApiResponse,
  CreateSubmissionFeedbackRequest,
  CreateSubmissionRequest,
  Submission,
  SubmissionFeedback,
  SubmissionVersion,
} from '../types/submission.type'

const SUBMISSIONS_PATH = '/api/submissions'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getSubmissions(): Promise<Submission[]> {
  const response = await apiClient<ApiResponse<Submission[]>>(SUBMISSIONS_PATH)
  return response.data
}

export function getSubmission(submissionId: number) {
  return apiClient<ApiResponse<Submission>>(`${SUBMISSIONS_PATH}/${submissionId}`)
}

export function getSubmissionByTopicRegistration(topicRegistrationId: number) {
  return apiClient<ApiResponse<Submission>>(
    `${SUBMISSIONS_PATH}/topic-registration/${topicRegistrationId}`,
  )
}

export function createSubmission(payload: CreateSubmissionRequest) {
  return apiClient<ApiResponse<Submission>>(SUBMISSIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Nộp báo cáo: upload file thật (multipart). Backend tự lấy tên/loại/kích thước file.
export function createSubmissionVersion(
  submissionId: number,
  file: File,
  changeNote?: string,
) {
  const formData = new FormData()
  formData.append('submissionId', String(submissionId))
  formData.append('file', file)
  if (changeNote?.trim()) {
    formData.append('changeNote', changeNote.trim())
  }

  return apiClient<ApiResponse<SubmissionVersion>>(
    `${SUBMISSIONS_PATH}/versions`,
    { method: 'POST', body: formData },
  )
}

// Tải file của một phiên bản báo cáo về máy.
export async function downloadSubmissionVersion(
  versionId: number,
  fileName: string,
) {
  const accessToken = tokenStorage.getAccessToken()
  const response = await fetch(
    `${API_BASE_URL}${SUBMISSIONS_PATH}/versions/${versionId}/download`,
    {
      headers: accessToken
        ? { Authorization: `${tokenStorage.getTokenType()} ${accessToken}` }
        : undefined,
    },
  )

  if (!response.ok) {
    throw new Error('Không thể tải file báo cáo.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || `bao-cao-${versionId}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function createSubmissionFeedback(
  payload: CreateSubmissionFeedbackRequest,
) {
  return apiClient<ApiResponse<SubmissionFeedback>>(
    `${SUBMISSIONS_PATH}/feedbacks`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function getFeedbacksBySubmissionVersion(
  submissionVersionId: number,
): Promise<SubmissionFeedback[]> {
  const response = await apiClient<ApiResponse<SubmissionFeedback[]>>(
    `${SUBMISSIONS_PATH}/versions/${submissionVersionId}/feedbacks`,
  )

  return response.data
}

export async function getMyFeedbacks(): Promise<SubmissionFeedback[]> {
  const response = await apiClient<ApiResponse<SubmissionFeedback[]>>(
    `${SUBMISSIONS_PATH}/feedbacks/me`,
  )

  return response.data
}
