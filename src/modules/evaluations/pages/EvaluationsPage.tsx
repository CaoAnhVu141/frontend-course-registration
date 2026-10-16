import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Award,
  ClipboardCheck,
  Megaphone,
  Star,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useConfirmation } from '../../confirmation'
import { useNotification } from '../../notification'
import { AppLoading } from '../../ui'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import {
  getCommitteeTopicAssignments,
  getMyAssignmentsAsLecturer,
} from '../../committeetopicassignments/services/committeeTopicAssignmentApi'
import type { CommitteeTopicAssignment } from '../../committeetopicassignments/types/committeeTopicAssignment.type'
import {
  createEvaluation,
  getEvaluationsByAssignment,
  getFinalResultByAssignment,
  getMyGroupFinalResults,
  publishFinalResult,
} from '../services/evaluationApi'
import type { Evaluation, FinalResult } from '../types/evaluation.type'
import './EvaluationsPage.css'

export function EvaluationsPage() {
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')

  const title = isLecturer
    ? 'CHẤM ĐIỂM ĐỀ TÀI'
    : isAdmin
      ? 'ĐIỂM & KẾT QUẢ BẢO VỆ'
      : 'KẾT QUẢ BẢO VỆ'

  return (
    <DashboardLayout title={title} contentClassName="evaluations-content">
      {isLecturer ? (
        <LecturerView />
      ) : isAdmin ? (
        <AdminView />
      ) : (
        <StudentView />
      )}
    </DashboardLayout>
  )
}

/* ----------------------------- GIẢNG VIÊN ----------------------------- */

function LecturerView() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()

  const [assignments, setAssignments] = useState<CommitteeTopicAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [assignmentId, setAssignmentId] = useState('')
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const selectedAssignment = useMemo(
    () =>
      assignments.find((assignment) => assignment.id === Number(assignmentId)) ??
      null,
    [assignmentId, assignments],
  )

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const data = await getMyAssignmentsAsLecturer()
      setAssignments(data)
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  const loadDetail = useCallback(
    async (id: number) => {
      setIsDetailLoading(true)
      try {
        const evaluationData = await getEvaluationsByAssignment(id)
        setEvaluations(evaluationData)
      } catch (error) {
        setEvaluations([])
        showError(getErrorMessage(error))
      }

      // Kết quả có thể chưa công bố -> backend ném lỗi, coi như chưa có.
      try {
        const resultData = await getFinalResultByAssignment(id)
        setFinalResult(resultData)
      } catch {
        setFinalResult(null)
      } finally {
        setIsDetailLoading(false)
      }
    },
    [showError],
  )

  useEffect(() => {
    if (!assignmentId) {
      setEvaluations([])
      setFinalResult(null)
      return
    }

    void loadDetail(Number(assignmentId))
  }, [assignmentId, loadDetail])

  // reset ô nhập khi đổi đề tài
  useEffect(() => {
    setScore('')
    setComment('')
  }, [assignmentId])

  async function handleGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!assignmentId) {
      showError('Vui lòng chọn đề tài cần chấm điểm.')
      return
    }

    const numericScore = Number(score)
    if (score === '' || Number.isNaN(numericScore)) {
      showError('Vui lòng nhập điểm hợp lệ.')
      return
    }

    if (numericScore < 0 || numericScore > 10) {
      showError('Điểm phải trong khoảng từ 0 đến 10.')
      return
    }

    try {
      setIsSaving(true)
      const response = await createEvaluation({
        assignmentId: Number(assignmentId),
        score: numericScore,
        comment: comment.trim() ? comment.trim() : undefined,
      })
      setEvaluations((current) => [...current, response.data])
      setScore('')
      setComment('')
      success(response.message)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!selectedAssignment) return

    const confirmed = await confirm({
      title: 'Công bố kết quả',
      message: `Công bố điểm cuối cho đề tài "${selectedAssignment.topicTitle}"? Sau khi công bố sẽ không thể chấm lại.`,
      confirmText: 'Công bố',
      cancelText: 'Đóng',
    })

    if (!confirmed) return

    try {
      setIsPublishing(true)
      const response = await publishFinalResult(selectedAssignment.id)
      setFinalResult(response.data)
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === selectedAssignment.id
            ? { ...assignment, status: 'COMPLETED' }
            : assignment,
        ),
      )
      success(response.message)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <section className="evaluation-panel">
        <AppLoading />
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="evaluation-panel">
        <div className="evaluation-message error" role="alert">
          {loadError}
          <button type="button" onClick={() => void loadAssignments()}>
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  const canGrade = selectedAssignment?.status === 'ASSIGNED' && !finalResult
  const canPublish = selectedAssignment?.status === 'ASSIGNED' && !finalResult

  return (
    <div className="evaluations-layout">
      {/* Cột chọn đề tài + chấm điểm */}
      <section className="evaluation-form-card">
        <header className="evaluation-form-head">
          <span className="evaluation-form-icon" aria-hidden="true">
            <ClipboardCheck size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2>Chấm điểm đề tài</h2>
            <p>
              Chọn đề tài bạn được phân công, nhập điểm (0 - 10) và nhận xét nếu
              có.
            </p>
          </div>
        </header>

        <div className="evaluation-form-body">
          <div className="form-field">
            <label className="form-label" htmlFor="evaluation-assignment">
              Đề tài được phân công
            </label>
            <select
              className="form-control"
              id="evaluation-assignment"
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
            >
              <option value="">Chọn đề tài</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.studentGroupName} — {assignment.topicTitle}
                  {assignment.status === 'COMPLETED' ? ' (đã bảo vệ)' : ''}
                </option>
              ))}
            </select>
            {assignments.length === 0 && (
              <p className="evaluation-hint warning">
                Bạn chưa có đề tài nào được phân công.
              </p>
            )}
          </div>

          {selectedAssignment && (
            <div className="evaluation-selected">
              <span>
                Hội đồng: {selectedAssignment.defenseCommitteeCode} -{' '}
                {selectedAssignment.defenseCommitteeName}
              </span>
            </div>
          )}

          {selectedAssignment && !canGrade && (
            <p className="evaluation-hint warning">
              {finalResult
                ? 'Đề tài đã công bố kết quả, không thể chấm thêm.'
                : 'Đề tài không ở trạng thái cho phép chấm điểm.'}
            </p>
          )}

          {canGrade && (
            <form onSubmit={(event) => void handleGrade(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="evaluation-score">
                  Điểm (0 - 10)
                </label>
                <div className="evaluation-score-box">
                  <Star size={16} strokeWidth={1.9} aria-hidden="true" />
                  <input
                    className="form-control"
                    id="evaluation-score"
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    placeholder="VD: 8.5"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="evaluation-comment">
                  Nhận xét
                </label>
                <textarea
                  className="form-control"
                  id="evaluation-comment"
                  rows={4}
                  maxLength={1000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Nhận xét về đề tài (tối đa 1000 ký tự)"
                />
                <span className="evaluation-count">{comment.length}/1000</span>
              </div>

              <div className="evaluation-form-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Chấm điểm'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Cột danh sách điểm + kết quả cuối */}
      <section className="evaluation-detail-card">
        <header className="evaluation-detail-head">
          <h2>Điểm thành phần</h2>
          {canPublish && evaluations.length > 0 && (
            <button
              type="button"
              className="evaluation-publish"
              disabled={isPublishing}
              onClick={() => void handlePublish()}
            >
              <Megaphone size={15} strokeWidth={1.9} aria-hidden="true" />
              {isPublishing ? 'Đang công bố...' : 'Công bố kết quả'}
            </button>
          )}
        </header>

        {!selectedAssignment ? (
          <div className="evaluation-empty">
            <ClipboardCheck size={28} strokeWidth={1.6} aria-hidden="true" />
            <p>Chọn một đề tài để xem điểm.</p>
          </div>
        ) : isDetailLoading ? (
          <AppLoading />
        ) : (
          <>
            {finalResult && (
              <div className="evaluation-final">
                <div className="evaluation-final-score">
                  <Award size={20} strokeWidth={1.9} aria-hidden="true" />
                  <div>
                    <span className="evaluation-final-label">Điểm cuối cùng</span>
                    <strong>{formatScore(finalResult.finalScore)}</strong>
                  </div>
                </div>
                <span className="evaluation-final-meta">
                  Công bố bởi {finalResult.publishedBy ?? '—'}
                  {finalResult.publishedAt
                    ? ` · ${formatDateTime(finalResult.publishedAt)}`
                    : ''}
                </span>
              </div>
            )}

            {evaluations.length === 0 ? (
              <div className="evaluation-empty">
                <Star size={28} strokeWidth={1.6} aria-hidden="true" />
                <p>Chưa có thành viên nào chấm điểm.</p>
              </div>
            ) : (
              <ul className="evaluation-list">
                {evaluations.map((evaluation) => (
                  <li key={evaluation.id} className="evaluation-item">
                    <div className="evaluation-item-head">
                      <span className="evaluation-item-lecturer">
                        {evaluation.lecturerCode || evaluation.lecturerEmail}
                      </span>
                      <span className="evaluation-item-score">
                        {formatScore(evaluation.score)}
                      </span>
                    </div>
                    {evaluation.comment && (
                      <p className="evaluation-item-comment">
                        {evaluation.comment}
                      </p>
                    )}
                    <span className="evaluation-item-time">
                      {formatDateTime(evaluation.submittedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/* ------------------------------ ADMIN ------------------------------ */

function AdminView() {
  const { error: showError } = useNotification()

  const [assignments, setAssignments] = useState<CommitteeTopicAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [assignmentId, setAssignmentId] = useState('')
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const selectedAssignment = useMemo(
    () =>
      assignments.find((assignment) => assignment.id === Number(assignmentId)) ??
      null,
    [assignmentId, assignments],
  )

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const data = await getCommitteeTopicAssignments()
      setAssignments(data)
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  const loadDetail = useCallback(
    async (id: number) => {
      setIsDetailLoading(true)
      try {
        setEvaluations(await getEvaluationsByAssignment(id))
      } catch (error) {
        setEvaluations([])
        showError(getErrorMessage(error))
      }

      // Kết quả có thể chưa công bố -> backend ném lỗi, coi như chưa có.
      try {
        setFinalResult(await getFinalResultByAssignment(id))
      } catch {
        setFinalResult(null)
      } finally {
        setIsDetailLoading(false)
      }
    },
    [showError],
  )

  useEffect(() => {
    if (!assignmentId) {
      setEvaluations([])
      setFinalResult(null)
      return
    }

    void loadDetail(Number(assignmentId))
  }, [assignmentId, loadDetail])

  if (isLoading) {
    return (
      <section className="evaluation-panel">
        <AppLoading />
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="evaluation-panel">
        <div className="evaluation-message error" role="alert">
          {loadError}
          <button type="button" onClick={() => void loadAssignments()}>
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="evaluations-layout">
      <section className="evaluation-form-card">
        <header className="evaluation-form-head">
          <span className="evaluation-form-icon" aria-hidden="true">
            <ClipboardCheck size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2>Tra cứu điểm &amp; kết quả</h2>
            <p>Chọn đề tài để xem điểm thành phần và kết quả bảo vệ.</p>
          </div>
        </header>

        <div className="evaluation-form-body">
          <div className="form-field">
            <label className="form-label" htmlFor="admin-evaluation-assignment">
              Đề tài phân công
            </label>
            <select
              className="form-control"
              id="admin-evaluation-assignment"
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
            >
              <option value="">Chọn đề tài</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.studentGroupName} — {assignment.topicTitle}
                </option>
              ))}
            </select>
            {assignments.length === 0 && (
              <p className="evaluation-hint warning">
                Chưa có phân công đề tài nào.
              </p>
            )}
          </div>

          {selectedAssignment && (
            <div className="evaluation-selected">
              <span>
                Hội đồng: {selectedAssignment.defenseCommitteeCode} -{' '}
                {selectedAssignment.defenseCommitteeName}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="evaluation-detail-card">
        <header className="evaluation-detail-head">
          <h2>Điểm thành phần</h2>
        </header>

        {!selectedAssignment ? (
          <div className="evaluation-empty">
            <ClipboardCheck size={28} strokeWidth={1.6} aria-hidden="true" />
            <p>Chọn một đề tài để xem điểm.</p>
          </div>
        ) : isDetailLoading ? (
          <AppLoading />
        ) : (
          <>
            {finalResult && (
              <div className="evaluation-final">
                <div className="evaluation-final-score">
                  <Award size={20} strokeWidth={1.9} aria-hidden="true" />
                  <div>
                    <span className="evaluation-final-label">Điểm cuối cùng</span>
                    <strong>{formatScore(finalResult.finalScore)}</strong>
                  </div>
                </div>
                <span className="evaluation-final-meta">
                  Công bố bởi {finalResult.publishedBy ?? '—'}
                  {finalResult.publishedAt
                    ? ` · ${formatDateTime(finalResult.publishedAt)}`
                    : ''}
                </span>
              </div>
            )}

            {evaluations.length === 0 ? (
              <div className="evaluation-empty">
                <Star size={28} strokeWidth={1.6} aria-hidden="true" />
                <p>Chưa có thành viên nào chấm điểm.</p>
              </div>
            ) : (
              <ul className="evaluation-list">
                {evaluations.map((evaluation) => (
                  <li key={evaluation.id} className="evaluation-item">
                    <div className="evaluation-item-head">
                      <span className="evaluation-item-lecturer">
                        {evaluation.lecturerCode || evaluation.lecturerEmail}
                      </span>
                      <span className="evaluation-item-score">
                        {formatScore(evaluation.score)}
                      </span>
                    </div>
                    {evaluation.comment && (
                      <p className="evaluation-item-comment">
                        {evaluation.comment}
                      </p>
                    )}
                    <span className="evaluation-item-time">
                      {formatDateTime(evaluation.submittedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/* ----------------------------- SINH VIÊN ----------------------------- */

function StudentView() {
  const { error: showError } = useNotification()

  const [results, setResults] = useState<FinalResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadResults = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const data = await getMyGroupFinalResults()
      setResults(data)
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadResults()
  }, [loadResults])

  if (isLoading) {
    return (
      <section className="evaluation-panel">
        <AppLoading />
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="evaluation-panel">
        <div className="evaluation-message error" role="alert">
          {loadError}
          <button type="button" onClick={() => void loadResults()}>
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <section className="evaluation-panel">
        <div className="evaluation-empty">
          <Award size={30} strokeWidth={1.6} aria-hidden="true" />
          <p>Nhóm của bạn chưa có kết quả bảo vệ nào được công bố.</p>
        </div>
      </section>
    )
  }

  return (
    <div className="evaluation-result-list">
      {results.map((result) => (
        <section key={result.id} className="evaluation-result-row">
          <div className="evaluation-result-main">
            <div className="evaluation-result-info">
              <span className="evaluation-result-group">
                <Users size={15} strokeWidth={1.9} aria-hidden="true" />
                {result.studentGroupName}
              </span>
              <p className="evaluation-result-topic">{result.topicTitle}</p>
              <span className="evaluation-result-published">
                Công bố{' '}
                {result.publishedAt ? formatDateTime(result.publishedAt) : ''}
              </span>
            </div>

            <div className="evaluation-result-final">
              <span className="evaluation-result-final-label">Điểm cuối</span>
              <strong>{formatScore(result.finalScore)}</strong>
            </div>
          </div>

          <div className="evaluation-result-members">
            {result.evaluations.length === 0 ? (
              <span className="evaluation-hint">Không có điểm thành phần.</span>
            ) : (
              result.evaluations.map((evaluation) => (
                <div key={evaluation.id} className="evaluation-result-member">
                  <div className="evaluation-result-member-info">
                    <span className="evaluation-result-member-name">
                      {evaluation.lecturerCode || 'Giảng viên'}
                    </span>
                    <span className="evaluation-result-member-email">
                      {evaluation.lecturerEmail}
                    </span>
                  </div>
                  <span className="evaluation-result-member-score">
                    {formatScore(evaluation.score)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------ helpers ------------------------------ */

function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined) return '—'
  return score.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
