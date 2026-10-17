import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CommitteeTopicAssignment,
  CreateCommitteeTopicAssignmentRequest,
  UpdateDefenseScheduleRequest,
} from '../types/committeeTopicAssignment.type'

const ASSIGNMENTS_PATH = '/api/committee-topic-assignments'

export function createCommitteeTopicAssignment(
  payload: CreateCommitteeTopicAssignmentRequest,
) {
  return apiClient<ApiResponse<CommitteeTopicAssignment>>(ASSIGNMENTS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDefenseSchedule(
  assignmentId: number,
  payload: UpdateDefenseScheduleRequest,
) {
  return apiClient<ApiResponse<CommitteeTopicAssignment>>(
    `${ASSIGNMENTS_PATH}/${assignmentId}/schedule`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function completeCommitteeTopicAssignment(assignmentId: number) {
  return apiClient<ApiResponse<CommitteeTopicAssignment>>(
    `${ASSIGNMENTS_PATH}/${assignmentId}/complete`,
    { method: 'PATCH' },
  )
}

export function cancelCommitteeTopicAssignment(assignmentId: number) {
  return apiClient<ApiResponse<CommitteeTopicAssignment>>(
    `${ASSIGNMENTS_PATH}/${assignmentId}/cancel`,
    { method: 'PATCH' },
  )
}

export async function getCommitteeTopicAssignments(): Promise<
  CommitteeTopicAssignment[]
> {
  const response =
    await apiClient<ApiResponse<CommitteeTopicAssignment[]>>(ASSIGNMENTS_PATH)

  return response.data
}

export function getCommitteeTopicAssignment(assignmentId: number) {
  return apiClient<ApiResponse<CommitteeTopicAssignment>>(
    `${ASSIGNMENTS_PATH}/${assignmentId}`,
  )
}

export async function getAssignmentsByDefenseCommittee(
  defenseCommitteeId: number,
): Promise<CommitteeTopicAssignment[]> {
  const response = await apiClient<ApiResponse<CommitteeTopicAssignment[]>>(
    `${ASSIGNMENTS_PATH}/defense-committee/${defenseCommitteeId}`,
  )

  return response.data
}

export async function getMyAssignmentsAsLecturer(): Promise<
  CommitteeTopicAssignment[]
> {
  const response = await apiClient<ApiResponse<CommitteeTopicAssignment[]>>(
    `${ASSIGNMENTS_PATH}/me`,
  )

  return response.data
}

export async function getMyGroupAssignments(): Promise<
  CommitteeTopicAssignment[]
> {
  const response = await apiClient<ApiResponse<CommitteeTopicAssignment[]>>(
    `${ASSIGNMENTS_PATH}/my-group`,
  )

  return response.data
}
