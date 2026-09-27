import { apiClient } from '../../../shared/services/apiClient'
import type {
  AddCommitteeMemberRequest,
  ApiResponse,
  CommitteeMember,
  CreateDefenseCommitteeRequest,
  DefenseCommittee,
} from '../types/defenseCommittee.type'

const DEFENSE_COMMITTEES_PATH = '/api/defense-committees'

export async function getDefenseCommittees(): Promise<DefenseCommittee[]> {
  const response = await apiClient<ApiResponse<DefenseCommittee[]>>(
    DEFENSE_COMMITTEES_PATH,
  )

  return response.data
}

export async function getDefenseCommitteesByRegistrationPeriod(
  registrationPeriodId: number,
): Promise<DefenseCommittee[]> {
  const response = await apiClient<ApiResponse<DefenseCommittee[]>>(
    `${DEFENSE_COMMITTEES_PATH}/registration-period/${registrationPeriodId}`,
  )

  return response.data
}

export function getDefenseCommittee(defenseCommitteeId: number) {
  return apiClient<ApiResponse<DefenseCommittee>>(
    `${DEFENSE_COMMITTEES_PATH}/${defenseCommitteeId}`,
  )
}

export async function getMyCommitteeMembers(): Promise<CommitteeMember[]> {
  const response = await apiClient<ApiResponse<CommitteeMember[]>>(
    `${DEFENSE_COMMITTEES_PATH}/me`,
  )

  return response.data
}

export function createDefenseCommittee(payload: CreateDefenseCommitteeRequest) {
  return apiClient<ApiResponse<DefenseCommittee>>(DEFENSE_COMMITTEES_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addCommitteeMember(
  defenseCommitteeId: number,
  payload: AddCommitteeMemberRequest,
) {
  return apiClient<ApiResponse<DefenseCommittee>>(
    `${DEFENSE_COMMITTEES_PATH}/${defenseCommitteeId}/members`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function closeDefenseCommittee(defenseCommitteeId: number) {
  return apiClient<ApiResponse<DefenseCommittee>>(
    `${DEFENSE_COMMITTEES_PATH}/${defenseCommitteeId}/close`,
    { method: 'PATCH' },
  )
}
