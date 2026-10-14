import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CreateEvaluationRequest,
  Evaluation,
  FinalResult,
} from '../types/evaluation.type'

const EVALUATIONS_PATH = '/api/evaluations'

// API #1: Giảng viên chấm điểm cho một phân công đề tài.
// POST /api/evaluations  (ROLE_LECTURER)
export function createEvaluation(payload: CreateEvaluationRequest) {
  return apiClient<ApiResponse<Evaluation>>(EVALUATIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// API #2: Chủ tịch hội đồng công bố kết quả cuối cùng.
// POST /api/evaluations/assignments/{assignmentId}/publish  (ROLE_LECTURER)
export function publishFinalResult(assignmentId: number) {
  return apiClient<ApiResponse<FinalResult>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}/publish`,
    { method: 'POST' },
  )
}

// API #3: Xem danh sách điểm thành phần của một phân công.
// GET /api/evaluations/assignments/{assignmentId}  (ROLE_ADMIN, ROLE_LECTURER)
export async function getEvaluationsByAssignment(
  assignmentId: number,
): Promise<Evaluation[]> {
  const response = await apiClient<ApiResponse<Evaluation[]>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}`,
  )

  return response.data
}

// API #4: Xem kết quả cuối cùng của một phân công.
// GET /api/evaluations/assignments/{assignmentId}/result
// (ROLE_ADMIN, ROLE_LECTURER, ROLE_STUDENT)
export async function getFinalResultByAssignment(
  assignmentId: number,
): Promise<FinalResult> {
  const response = await apiClient<ApiResponse<FinalResult>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}/result`,
  )

  return response.data
}

// API #5: Sinh viên xem kết quả đã công bố của nhóm mình.
// GET /api/evaluations/my-group  (ROLE_STUDENT)
export async function getMyGroupFinalResults(): Promise<FinalResult[]> {
  const response = await apiClient<ApiResponse<FinalResult[]>>(
    `${EVALUATIONS_PATH}/my-group`,
  )

  return response.data
}
