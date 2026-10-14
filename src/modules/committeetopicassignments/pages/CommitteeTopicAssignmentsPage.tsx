import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  DoorOpen,
  Gavel,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useConfirmation } from '../../confirmation'
import { useNotification } from '../../notification'
import { AppLoading, Pagination } from '../../ui'
import { getDefenseCommittees } from '../../defensecommittees/services/defenseCommitteeApi'
import type { DefenseCommittee } from '../../defensecommittees/types/defenseCommittee.type'
import { getTopicRegistrations } from '../../topicregistrations/services/topicRegistrationApi'
import type { TopicRegistration } from '../../topicregistrations/types/topicRegistration.type'
import { getTopics } from '../../topics/services/topicApi'
import type { Topic } from '../../topics/types/topic.type'
import { getRegistrationPeriods } from '../../topics/services/registrationPeriodApi'
import type { RegistrationPeriod } from '../../topics/types/registrationPeriod.type'
import {
  cancelCommitteeTopicAssignment,
  completeCommitteeTopicAssignment,
  createCommitteeTopicAssignment,
  getCommitteeTopicAssignments,
} from '../services/committeeTopicAssignmentApi'
import type { CommitteeTopicAssignment } from '../types/committeeTopicAssignment.type'
import './CommitteeTopicAssignmentsPage.css'

const PAGE_SIZE = 5

const statusConfig: Record<
  CommitteeTopicAssignment['status'],
  { label: string; tone: 'assigned' | 'completed' | 'canceled' }
> = {
  ASSIGNED: { label: 'Đã phân công', tone: 'assigned' },
  COMPLETED: { label: 'Đã bảo vệ', tone: 'completed' },
  CANCELED: { label: 'Đã hủy', tone: 'canceled' },
}

export function CommitteeTopicAssignmentsPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()

  const [committees, setCommittees] = useState<DefenseCommittee[]>([])
  const [registrations, setRegistrations] = useState<TopicRegistration[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [committeeId, setCommitteeId] = useState('')
  const [registrationId, setRegistrationId] = useState('')
  const [withSchedule, setWithSchedule] = useState(false)
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [room, setRoom] = useState('')

  const [assignments, setAssignments] = useState<CommitteeTopicAssignment[]>([])
  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const periodNameMap = useMemo(
    () => new Map(periods.map((period) => [period.id, period.name])),
    [periods],
  )

  // topicId -> registrationPeriodId, để lọc đề tài theo kỳ của hội đồng
  const topicPeriodMap = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic.registrationPeriodId])),
    [topics],
  )

  // Hội đồng đủ điều kiện nhận phân công: chưa đóng và đã có chủ tịch
  const eligibleCommittees = useMemo(
    () =>
      committees.filter(
        (committee) =>
          committee.status !== 'CLOSED' &&
          (committee.committeeMembers ?? []).some(
            (member) => member.committeeRole === 'CHAIRMAN',
          ),
      ),
    [committees],
  )

  const selectedCommittee = useMemo(
    () =>
      eligibleCommittees.find(
        (committee) => committee.id === Number(committeeId),
      ) ?? null,
    [committeeId, eligibleCommittees],
  )

  const assignedRegistrationIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.status !== 'CANCELED')
          .map((assignment) => assignment.topicRegistrationId),
      ),
    [assignments],
  )

  // Mới nhất lên đầu
  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((first, second) => {
        const firstTime = new Date(first.assignedAt).getTime()
        const secondTime = new Date(second.assignedAt).getTime()

        if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
          return second.id - first.id
        }

        return secondTime - firstTime
      }),
    [assignments],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(sortedAssignments.length / PAGE_SIZE),
  )
  const visibleAssignments = sortedAssignments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  // Đăng ký đề tài hợp lệ: đã duyệt, cùng kỳ với hội đồng đang chọn,
  // và chưa được phân công trong phiên này.
  const eligibleRegistrations = useMemo(() => {
    if (!selectedCommittee) return []

    return registrations.filter(
      (registration) =>
        registration.status === 'APPROVED' &&
        topicPeriodMap.get(registration.topicId) ===
          selectedCommittee.registrationPeriodId &&
        !assignedRegistrationIds.has(registration.id),
    )
  }, [assignedRegistrationIds, registrations, selectedCommittee, topicPeriodMap])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')

      const [
        committeeData,
        registrationData,
        topicData,
        periodData,
        assignmentData,
      ] = await Promise.all([
        getDefenseCommittees(),
        getTopicRegistrations(),
        getTopics(),
        getRegistrationPeriods(),
        getCommitteeTopicAssignments(),
      ])

      setCommittees(committeeData)
      setRegistrations(registrationData)
      setTopics(topicData)
      setPeriods(periodData)
      setAssignments(assignmentData)
      setPage(1)
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Đổi hội đồng thì reset đề tài đã chọn (khác kỳ)
  useEffect(() => {
    setRegistrationId('')
  }, [committeeId])

  function resetForm() {
    setCommitteeId('')
    setRegistrationId('')
    setWithSchedule(false)
    setScheduledStart('')
    setScheduledEnd('')
    setRoom('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!committeeId || !registrationId) {
      showError('Vui lòng chọn hội đồng và đề tài cần phân công.')
      return
    }

    if (withSchedule && (!scheduledStart || !scheduledEnd)) {
      showError('Vui lòng nhập đầy đủ giờ bắt đầu và giờ kết thúc.')
      return
    }

    try {
      setIsSaving(true)
      const response = await createCommitteeTopicAssignment({
        defenseCommitteeId: Number(committeeId),
        topicRegistrationId: Number(registrationId),
        scheduledStart: withSchedule
          ? toApiDateTime(scheduledStart)
          : undefined,
        scheduledEnd: withSchedule ? toApiDateTime(scheduledEnd) : undefined,
        room: withSchedule && room.trim() ? room.trim() : undefined,
      })

      setAssignments((current) => [response.data, ...current])
      setPage(1)
      success(response.message)
      resetForm()
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleComplete(assignment: CommitteeTopicAssignment) {
    const confirmed = await confirm({
      title: 'Xác nhận hoàn thành bảo vệ',
      message: `Xác nhận đề tài "${assignment.topicTitle}" đã bảo vệ xong?`,
      confirmText: 'Xác nhận',
      cancelText: 'Đóng',
    })

    if (!confirmed) return

    try {
      setProcessingId(assignment.id)
      const response = await completeCommitteeTopicAssignment(assignment.id)
      setAssignments((current) =>
        current.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      )
      success(response.message)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCancel(assignment: CommitteeTopicAssignment) {
    const confirmed = await confirm({
      title: 'Hủy phân công',
      message: `Bạn có chắc muốn hủy phân công đề tài "${assignment.topicTitle}" không?`,
      confirmText: 'Hủy phân công',
      cancelText: 'Đóng',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setProcessingId(assignment.id)
      const response = await cancelCommitteeTopicAssignment(assignment.id)
      setAssignments((current) =>
        current.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      )
      success(response.message)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  const canSubmit =
    Boolean(committeeId) && Boolean(registrationId) && !isSaving

  return (
    <DashboardLayout
      title="PHÂN CÔNG ĐỀ TÀI"
      contentClassName="assignments-content"
    >
      {isLoading ? (
        <section className="assignments-panel">
          <AppLoading />
        </section>
      ) : loadError ? (
        <section className="assignments-panel">
          <div className="assignment-message error" role="alert">
            {loadError}
            <button type="button" onClick={() => void loadData()}>
              Thử lại
            </button>
          </div>
        </section>
      ) : (
        <div className="assignments-layout">
          <section className="assignment-form-card">
            <header className="assignment-form-head">
              <span className="assignment-form-icon" aria-hidden="true">
                <Gavel size={20} strokeWidth={1.9} />
              </span>
              <div>
                <h2>Phân công hội đồng chấm đề tài</h2>
                <p>
                  Gán một đề tài đã duyệt cho hội đồng bảo vệ cùng kỳ đăng ký,
                  kèm lịch bảo vệ nếu đã sắp xếp.
                </p>
              </div>
            </header>

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="assignment-committee">
                  Hội đồng bảo vệ
                </label>
                <select
                  className="form-control"
                  id="assignment-committee"
                  value={committeeId}
                  onChange={(event) => setCommitteeId(event.target.value)}
                >
                  <option value="">Chọn hội đồng</option>
                  {eligibleCommittees.map((committee) => (
                    <option key={committee.id} value={committee.id}>
                      {committee.code} - {committee.name} (
                      {periodNameMap.get(committee.registrationPeriodId) ??
                        `#${committee.registrationPeriodId}`}
                      )
                    </option>
                  ))}
                </select>
                {eligibleCommittees.length === 0 && (
                  <p className="assignment-hint warning">
                    Chưa có hội đồng nào đủ điều kiện (phải đang hoạt động và đã
                    có chủ tịch).
                  </p>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="assignment-registration">
                  Đề tài đã duyệt
                </label>
                <select
                  className="form-control"
                  id="assignment-registration"
                  value={registrationId}
                  disabled={!selectedCommittee}
                  onChange={(event) => setRegistrationId(event.target.value)}
                >
                  <option value="">
                    {selectedCommittee
                      ? 'Chọn đề tài đăng ký'
                      : 'Chọn hội đồng trước'}
                  </option>
                  {eligibleRegistrations.map((registration) => (
                    <option key={registration.id} value={registration.id}>
                      {registration.studentGroupName} — {registration.topicTitle}
                    </option>
                  ))}
                </select>
                {selectedCommittee && eligibleRegistrations.length === 0 && (
                  <p className="assignment-hint warning">
                    Không có đề tài đã duyệt nào cùng kỳ đăng ký với hội đồng
                    này (hoặc đã được phân công).
                  </p>
                )}
              </div>

              <label className="assignment-toggle">
                <input
                  type="checkbox"
                  checked={withSchedule}
                  onChange={(event) => setWithSchedule(event.target.checked)}
                />
                <span>
                  <CalendarClock size={16} strokeWidth={1.9} aria-hidden="true" />
                  Xếp lịch bảo vệ ngay
                </span>
              </label>

              {withSchedule && (
                <div className="assignment-schedule">
                  <div className="assignment-schedule-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="assignment-start">
                        Giờ bắt đầu
                      </label>
                      <input
                        className="form-control"
                        id="assignment-start"
                        type="datetime-local"
                        value={scheduledStart}
                        onChange={(event) =>
                          setScheduledStart(event.target.value)
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="assignment-end">
                        Giờ kết thúc
                      </label>
                      <input
                        className="form-control"
                        id="assignment-end"
                        type="datetime-local"
                        value={scheduledEnd}
                        onChange={(event) => setScheduledEnd(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="assignment-room">
                      Phòng bảo vệ
                    </label>
                    <input
                      className="form-control"
                      id="assignment-room"
                      maxLength={100}
                      value={room}
                      onChange={(event) => setRoom(event.target.value)}
                      placeholder="VD: A5-101"
                    />
                  </div>

                  <p className="assignment-hint">
                    Giờ bắt đầu không được sớm hơn ngày bảo vệ của kỳ, giờ kết
                    thúc phải sau giờ bắt đầu và phòng không trùng lịch.
                  </p>
                </div>
              )}

              <div className="assignment-form-actions">
                <button type="button" className="secondary" onClick={resetForm}>
                  Nhập lại
                </button>
                <button type="submit" disabled={!canSubmit}>
                  {isSaving ? 'Đang phân công...' : 'Phân công'}
                </button>
              </div>
            </form>
          </section>

          <section className="assignment-recent-card">
            <header className="assignment-recent-head">
              <h2>Danh sách phân công</h2>
              <span className="assignment-count">{assignments.length}</span>
            </header>

            {assignments.length === 0 ? (
              <div className="assignment-recent-empty">
                <CheckCircle2 size={30} strokeWidth={1.6} aria-hidden="true" />
                <p>Chưa có phân công nào.</p>
              </div>
            ) : (
              <ul className="assignment-recent-list">
                {visibleAssignments.map((assignment) => (
                  <li key={assignment.id} className="assignment-item">
                    <div className="assignment-item-head">
                      <span className="assignment-item-topic">
                        {assignment.topicTitle}
                      </span>
                      <span
                        className={`assignment-status ${
                          statusConfig[assignment.status]?.tone ?? 'assigned'
                        }`}
                      >
                        {statusConfig[assignment.status]?.label ??
                          assignment.status}
                      </span>
                    </div>

                    <div className="assignment-item-meta">
                      <span>
                        <Gavel size={14} strokeWidth={1.9} aria-hidden="true" />
                        {assignment.defenseCommitteeCode} -{' '}
                        {assignment.defenseCommitteeName}
                      </span>
                      <span>
                        <Users size={14} strokeWidth={1.9} aria-hidden="true" />
                        {assignment.studentGroupName}
                      </span>
                      {assignment.scheduledStart ? (
                        <span>
                          <CalendarClock
                            size={14}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                          {formatDateTime(assignment.scheduledStart)}
                          {assignment.scheduledEnd
                            ? ` - ${formatTime(assignment.scheduledEnd)}`
                            : ''}
                        </span>
                      ) : (
                        <span className="assignment-item-muted">
                          <CalendarClock
                            size={14}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                          Chưa xếp lịch
                        </span>
                      )}
                      {assignment.room && (
                        <span>
                          <DoorOpen
                            size={14}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                          {assignment.room}
                        </span>
                      )}
                    </div>

                    {assignment.status === 'ASSIGNED' && (
                      <div className="assignment-item-actions">
                        <button
                          type="button"
                          className="complete"
                          disabled={processingId === assignment.id}
                          onClick={() => void handleComplete(assignment)}
                          title="Xác nhận đã bảo vệ"
                        >
                          <Check size={15} strokeWidth={1.9} aria-hidden="true" />
                          <span>Đã bảo vệ</span>
                        </button>
                        <button
                          type="button"
                          className="cancel"
                          disabled={processingId === assignment.id}
                          onClick={() => void handleCancel(assignment)}
                          title="Hủy phân công"
                        >
                          <Ban size={15} strokeWidth={1.9} aria-hidden="true" />
                          <span>Hủy</span>
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {assignments.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
