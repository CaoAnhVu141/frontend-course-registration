import { apiClient } from '../../../shared/services/apiClient'
import type { ApiResponse, ExpertiseTag } from '../types/expertiseTag.type'

const EXPERTISE_TAGS_PATH = '/api/expertise-tags'

export async function getExpertiseTags(): Promise<ExpertiseTag[]> {
    const response = await apiClient<ApiResponse<ExpertiseTag[]>>(
        EXPERTISE_TAGS_PATH,
    )

    return response.data
}
