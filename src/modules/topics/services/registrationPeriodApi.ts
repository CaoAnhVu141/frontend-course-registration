import { apiClient } from '../../../shared/services/apiClient'
import type { ApiResponse } from '../types/topic.type'
import type { RegistrationPeriod } from '../types/registrationPeriod.type'

const REGISTRATION_PERIODS_PATH = '/api/registration-periods'

export async function getRegistrationPeriods(): Promise<RegistrationPeriod[]> {
  const response = await apiClient<ApiResponse<RegistrationPeriod[]>>(
    REGISTRATION_PERIODS_PATH,
  )

  return response.data
}
