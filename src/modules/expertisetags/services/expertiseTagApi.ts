import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  ExpertiseTag,
  ExpertiseTagRequest,
} from '../types/expertiseTag.type'

const EXPERTISE_TAGS_PATH = '/api/expertise-tags'

export async function getExpertiseTags(): Promise<ExpertiseTag[]> {
  const response = await apiClient<ApiResponse<ExpertiseTag[]>>(EXPERTISE_TAGS_PATH)
  return response.data
}

export function createExpertiseTag(payload: ExpertiseTagRequest) {
  return apiClient<ApiResponse<ExpertiseTag>>(EXPERTISE_TAGS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExpertiseTag(id: number, payload: ExpertiseTagRequest) {
  return apiClient<ApiResponse<ExpertiseTag>>(`${EXPERTISE_TAGS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteExpertiseTag(id: number) {
  return apiClient<ApiResponse<null>>(`${EXPERTISE_TAGS_PATH}/${id}`, {
    method: 'DELETE',
  })
}
