import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  RegistrationPeriod,
  RegistrationPeriodRequest,
} from '../types/registrationPeriod.type'

const REGISTRATION_PERIODS_PATH = '/api/registration-periods'

export async function getRegistrationPeriods(): Promise<RegistrationPeriod[]> {
  const response = await apiClient<ApiResponse<RegistrationPeriod[]>>(
    REGISTRATION_PERIODS_PATH,
  )

  return response.data
}

export function createRegistrationPeriod(payload: RegistrationPeriodRequest) {
  return apiClient<ApiResponse<RegistrationPeriod>>(REGISTRATION_PERIODS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRegistrationPeriod(
  id: number,
  payload: RegistrationPeriodRequest,
) {
  return apiClient<ApiResponse<RegistrationPeriod>>(
    `${REGISTRATION_PERIODS_PATH}/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function deleteRegistrationPeriod(id: number) {
  return apiClient<ApiResponse<null>>(`${REGISTRATION_PERIODS_PATH}/${id}`, {
    method: 'DELETE',
  })
}
