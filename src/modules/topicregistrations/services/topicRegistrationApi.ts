import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CreateTopicRegistrationRequest,
  RejectTopicRegistrationRequest,
  TopicRegistration,
} from '../types/topicRegistration.type'

const TOPIC_REGISTRATIONS_PATH = '/api/topic-registrations'

export async function getTopicRegistrations(): Promise<TopicRegistration[]> {
  const response = await apiClient<ApiResponse<TopicRegistration[]>>(
    TOPIC_REGISTRATIONS_PATH,
  )

  return response.data
}

export async function getMyTopicRegistrations(): Promise<TopicRegistration[]> {
  const response = await apiClient<ApiResponse<TopicRegistration[]>>(
    `${TOPIC_REGISTRATIONS_PATH}/me`,
  )

  return response.data
}

export function getTopicRegistration(id: number) {
  return apiClient<ApiResponse<TopicRegistration>>(
    `${TOPIC_REGISTRATIONS_PATH}/${id}`,
  )
}

export async function getTopicRegistrationsByStudentGroup(
  studentGroupId: number,
): Promise<TopicRegistration[]> {
  const response = await apiClient<ApiResponse<TopicRegistration[]>>(
    `${TOPIC_REGISTRATIONS_PATH}/student-group/${studentGroupId}`,
  )

  return response.data
}

export async function getTopicRegistrationsByTopic(
  topicId: number,
): Promise<TopicRegistration[]> {
  const response = await apiClient<ApiResponse<TopicRegistration[]>>(
    `${TOPIC_REGISTRATIONS_PATH}/topic/${topicId}`,
  )

  return response.data
}

export function createTopicRegistration(
  payload: CreateTopicRegistrationRequest,
) {
  return apiClient<ApiResponse<TopicRegistration>>(TOPIC_REGISTRATIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveTopicRegistration(id: number) {
  return apiClient<ApiResponse<TopicRegistration>>(
    `${TOPIC_REGISTRATIONS_PATH}/${id}/approve`,
    { method: 'PATCH' },
  )
}

export function rejectTopicRegistration(
  id: number,
  payload: RejectTopicRegistrationRequest,
) {
  return apiClient<ApiResponse<TopicRegistration>>(
    `${TOPIC_REGISTRATIONS_PATH}/${id}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function cancelTopicRegistration(id: number) {
  return apiClient<ApiResponse<TopicRegistration>>(
    `${TOPIC_REGISTRATIONS_PATH}/${id}/cancel`,
    { method: 'PATCH' },
  )
}
