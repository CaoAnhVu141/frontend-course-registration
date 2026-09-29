import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CreateSubmissionFeedbackRequest,
  CreateSubmissionRequest,
  CreateSubmissionVersionRequest,
  Submission,
  SubmissionFeedback,
  SubmissionVersion,
} from '../types/submission.type'

const SUBMISSIONS_PATH = '/api/submissions'

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

export function createSubmissionVersion(payload: CreateSubmissionVersionRequest) {
  return apiClient<ApiResponse<SubmissionVersion>>(`${SUBMISSIONS_PATH}/versions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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
