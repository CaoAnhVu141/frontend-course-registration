import type { CommitteeTopicAssignment } from '../../committeetopicassignments/types/committeeTopicAssignment.type'
import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  FinalResult,
  PeriodFinalResult,
} from '../types/statistics.type'

const EVALUATIONS_PATH = '/api/evaluations'

export async function getFinalResultByAssignment(
  assignmentId: number,
): Promise<FinalResult> {
  const response = await apiClient<ApiResponse<FinalResult>>(
    `${EVALUATIONS_PATH}/assignments/${assignmentId}/result`,
  )

  return response.data
}

export async function getPublishedFinalResults(
  assignments: CommitteeTopicAssignment[],
): Promise<PeriodFinalResult[]> {
  const completedAssignments = assignments.filter(
    (assignment) => assignment.status === 'COMPLETED',
  )
  const requests = completedAssignments.map(async (assignment) => ({
    registrationPeriodId: assignment.registrationPeriodId,
    result: await getFinalResultByAssignment(assignment.id),
  }))
  const responses = await Promise.allSettled(requests)

  return responses.flatMap((response) =>
    response.status === 'fulfilled' && response.value.result.published
      ? [response.value]
      : [],
  )
}
