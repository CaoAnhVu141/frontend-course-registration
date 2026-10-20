import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  Topic,
  TopicRequest,
  TopicStatus,
} from '../types/topic.type'

const TOPICS_PATH = '/api/topics'

export async function getTopics(): Promise<Topic[]> {
  const response = await apiClient<ApiResponse<Topic[]>>(TOPICS_PATH)
  return response.data
}

export type TopicSearchParams = {
  keyword?: string
  departmentId?: number
  registrationPeriodId?: number
  status?: TopicStatus
}

export async function searchTopics(
  params: TopicSearchParams,
): Promise<Topic[]> {
  const query = new URLSearchParams()
  if (params.keyword?.trim()) query.set('keyword', params.keyword.trim())
  if (params.departmentId) query.set('departmentId', String(params.departmentId))
  if (params.registrationPeriodId)
    query.set('registrationPeriodId', String(params.registrationPeriodId))
  if (params.status) query.set('status', params.status)

  const queryString = query.toString()
  const response = await apiClient<ApiResponse<Topic[]>>(
    `${TOPICS_PATH}/search${queryString ? `?${queryString}` : ''}`,
  )

  return response.data
}

export async function getPublishedTopics(): Promise<Topic[]> {
  const response = await apiClient<ApiResponse<Topic[]>>(
    `${TOPICS_PATH}/published`,
  )

  return response.data
}

export async function createTopic(
  payload: TopicRequest,
): Promise<ApiResponse<Topic>> {
  return apiClient<ApiResponse<Topic>>(TOPICS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTopic(
  topicId: number,
  payload: TopicRequest,
): Promise<ApiResponse<Topic>> {
  return apiClient<ApiResponse<Topic>>(`${TOPICS_PATH}/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteTopic(
  topicId: number,
): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`${TOPICS_PATH}/${topicId}`, {
    method: 'DELETE',
  })
}

export async function approveTopic(
  topicId: number,
): Promise<ApiResponse<Topic>> {
  return apiClient<ApiResponse<Topic>>(`${TOPICS_PATH}/${topicId}/approve`, {
    method: 'PATCH',
  })
}

export async function rejectTopic(
  topicId: number,
  reason: string,
): Promise<ApiResponse<Topic>> {
  return apiClient<ApiResponse<Topic>>(`${TOPICS_PATH}/${topicId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export async function publishTopic(
  topicId: number,
): Promise<ApiResponse<Topic>> {
  return apiClient<ApiResponse<Topic>>(`${TOPICS_PATH}/${topicId}/publish`, {
    method: 'PATCH',
  })
}
