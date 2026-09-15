export type RegistrationPeriod = {
  id: number
  name: string
  type: string
  lecturerRegistrationStart: string
  lecturerRegistrationEnd: string
  studentRegistrationStart: string
  studentRegistrationEnd: string
  reviewerScoreDeadline: string
  defenseDate: string
  status: boolean
}

export type RegistrationPeriodRequest = {
  name: string
  type: string
  lecturerRegistrationStart: string
  lecturerRegistrationEnd: string
  studentRegistrationStart: string
  studentRegistrationEnd: string
  reviewerScoreDeadline: string
  defenseDate: string
  status?: boolean
}

export type ApiResponse<T> = {
  timestamp: string
  status: number
  message: string
  data: T
}
