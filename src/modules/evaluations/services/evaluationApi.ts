import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CreateEvaluationRequest,
  Evaluation,
  FinalResult,
} from '../types/evaluation.type'

const EVALUATIONS_PATH = '/api/evaluations'

export function createEvaluation(payload: CreateEvaluationRequest) {
  return apiClient<ApiResponse<Evaluation>>(EVALUATIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function publishFinalResult(assignmentId: number) {
  return apiClient<ApiResponse<FinalResult>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}/publish`,
    { method: 'POST' },
  )
}

export async function getEvaluationsByAssignment(
  assignmentId: number,
): Promise<Evaluation[]> {
  const response = await apiClient<ApiResponse<Evaluation[]>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}`,
  )

  return response.data
}

export async function getFinalResultByAssignment(
  assignmentId: number,
): Promise<FinalResult> {
  const response = await apiClient<ApiResponse<FinalResult>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}/result`,
  )

  return response.data
}

export async function getMyGroupFinalResults(): Promise<FinalResult[]> {
  const response = await apiClient<ApiResponse<FinalResult[]>>(
    `${EVALUATIONS_PATH}/my-group`,
  )

  return response.data
}
