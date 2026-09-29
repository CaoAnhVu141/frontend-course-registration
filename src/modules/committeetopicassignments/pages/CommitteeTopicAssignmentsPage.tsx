import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Gavel,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading } from '../../ui'
import { getDefenseCommittees } from '../../defensecommittees/services/defenseCommitteeApi'
import type { DefenseCommittee } from '../../defensecommittees/types/defenseCommittee.type'
import { getTopicRegistrations } from '../../topicregistrations/services/topicRegistrationApi'
import type { TopicRegistration } from '../../topicregistrations/types/topicRegistration.type'
import { getTopics } from '../../topics/services/topicApi'
import type { Topic } from '../../topics/types/topic.type'
import { getRegistrationPeriods } from '../../topics/services/registrationPeriodApi'
import type { RegistrationPeriod } from '../../topics/types/registrationPeriod.type'
import { createCommitteeTopicAssignment } from '../services/committeeTopicAssignmentApi'
import type { CommitteeTopicAssignment } from '../types/committeeTopicAssignment.type'
import './CommitteeTopicAssignmentsPage.css'

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

  const [recentAssignments, setRecentAssignments] = useState<
    CommitteeTopicAssignment[]
  >([])

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
        recentAssignments
          .filter((assignment) => assignment.status !== 'CANCELED')
          .map((assignment) => assignment.topicRegistrationId),
      ),
    [recentAssignments],
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

      const [committeeData, registrationData, topicData, periodData] =
        await Promise.all([
          getDefenseCommittees(),
          getTopicRegistrations(),
          getTopics(),
          getRegistrationPeriods(),
        ])

      setCommittees(committeeData)
      setRegistrations(registrationData)
      setTopics(topicData)
      setPeriods(periodData)
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

      setRecentAssignments((current) => [response.data, ...current])
      success(response.message)
      resetForm()
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
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
              <h2>Phân công trong phiên này</h2>
              <span className="assignment-count">{recentAssignments.length}</span>
            </header>

            {recentAssignments.length === 0 ? (
              <div className="assignment-recent-empty">
                <CheckCircle2 size={30} strokeWidth={1.6} aria-hidden="true" />
                <p>Chưa có phân công nào được tạo trong phiên này.</p>
              </div>
            ) : (
              <ul className="assignment-recent-list">
                {recentAssignments.map((assignment) => (
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
                  </li>
                ))}
              </ul>
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
