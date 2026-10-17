import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  Star,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { getCommitteeTopicAssignments } from '../../committeetopicassignments/services/committeeTopicAssignmentApi'
import type { CommitteeTopicAssignment } from '../../committeetopicassignments/types/committeeTopicAssignment.type'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { getRegistrationPeriods } from '../../registrationperiods/services/registrationPeriodApi'
import type { RegistrationPeriod } from '../../registrationperiods/types/registrationPeriod.type'
import { getStudentGroups } from '../../studentgroups/services/studentGroupApi'
import type { StudentGroup } from '../../studentgroups/types/studentGroup.type'
import { getSubmissions } from '../../submissions/services/submissionApi'
import type { Submission } from '../../submissions/types/submission.type'
import { getTopicRegistrations } from '../../topicregistrations/services/topicRegistrationApi'
import type { TopicRegistration } from '../../topicregistrations/types/topicRegistration.type'
import { getTopics } from '../../topics/services/topicApi'
import type { Topic, TopicStatus } from '../../topics/types/topic.type'
import { AppLoading } from '../../ui'
import { getPublishedFinalResults } from '../services/statisticsApi'
import type { PeriodFinalResult } from '../types/statistics.type'
import './StatisticsPage.css'

type StatisticsData = {
  groups: StudentGroup[]
  submissions: Submission[]
  topics: Topic[]
  periods: RegistrationPeriod[]
  registrations: TopicRegistration[]
  assignments: CommitteeTopicAssignment[]
  finalResults: PeriodFinalResult[]
}

const EMPTY_DATA: StatisticsData = {
  groups: [],
  submissions: [],
  topics: [],
  periods: [],
  registrations: [],
  assignments: [],
  finalResults: [],
}

const APPROVED_TOPIC_STATUSES = new Set<TopicStatus>([
  'APPROVED',
  'PUBLISHED',
  'CLOSED',
])

export function StatisticsPage() {
  const { error: showError } = useNotification()
  const [data, setData] = useState<StatisticsData>(EMPTY_DATA)
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')

      const [
        groups,
        submissions,
        topics,
        periods,
        registrations,
        assignments,
      ] = await Promise.all([
        getStudentGroups(),
        getSubmissions(),
        getTopics(),
        getRegistrationPeriods(),
        getTopicRegistrations(),
        getCommitteeTopicAssignments(),
      ])
      const finalResults = await getPublishedFinalResults(assignments)

      setData({
        groups,
        submissions,
        topics,
        periods,
        registrations,
        assignments,
        finalResults,
      })
      setUpdatedAt(new Date())
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadStatistics()
  }, [loadStatistics])

  const statistics = useMemo(() => {
    const periodId = selectedPeriodId ? Number(selectedPeriodId) : null
    const groupPeriodMap = new Map(
      data.groups.map((group) => [group.id, group.registrationPeriodId]),
    )
    const registrationMap = new Map(
      data.registrations.map((registration) => [registration.id, registration]),
    )
    const topicPeriodMap = new Map(
      data.topics.map((topic) => [topic.id, topic.registrationPeriodId]),
    )
    const belongsToSelectedPeriod = (itemPeriodId: number | undefined) =>
      periodId === null || itemPeriodId === periodId

    const groups = data.groups.filter((group) =>
      belongsToSelectedPeriod(group.registrationPeriodId),
    )
    const submissions = data.submissions.filter((submission) => {
      const registration = registrationMap.get(submission.topicRegistrationId)
      const submissionPeriodId = registration
        ? groupPeriodMap.get(registration.studentGroupId) ??
          topicPeriodMap.get(registration.topicId)
        : undefined

      return belongsToSelectedPeriod(submissionPeriodId)
    })
    const topics = data.topics.filter((topic) =>
      belongsToSelectedPeriod(topic.registrationPeriodId),
    )
    const finalResults = data.finalResults.filter((item) =>
      belongsToSelectedPeriod(item.registrationPeriodId),
    )
    const approvedTopics = topics.filter((topic) =>
      APPROVED_TOPIC_STATUSES.has(topic.status),
    ).length
    const rejectedTopics = topics.filter(
      (topic) => topic.status === 'REJECTED',
    ).length
    const pendingTopics = topics.filter(
      (topic) => topic.status === 'PENDING',
    ).length

    return {
      totalGroups: groups.length,
      totalSubmissions: submissions.length,
      averageScore: calculateAverage(
        finalResults.map((item) => item.result.finalScore),
      ),
      gradedGroupCount: finalResults.length,
      approvedTopics,
      rejectedTopics,
      pendingTopics,
      totalTopics: topics.length,
    }
  }, [data, selectedPeriodId])

  const periodAverages = useMemo(
    () =>
      [...data.periods]
        .sort((first, second) => first.id - second.id)
        .map((period) => {
          const scores = data.finalResults
            .filter((item) => item.registrationPeriodId === period.id)
            .map((item) => item.result.finalScore)

          return {
            period,
            averageScore: calculateAverage(scores),
            resultCount: scores.length,
          }
        }),
    [data.finalResults, data.periods],
  )

  const selectedPeriodName = selectedPeriodId
    ? data.periods.find((period) => period.id === Number(selectedPeriodId))
        ?.name ?? 'Kỳ đã chọn'
    : 'Tất cả các kỳ'
  const approvedRatio = getRatio(
    statistics.approvedTopics,
    statistics.totalTopics,
  )
  const rejectedRatio = getRatio(
    statistics.rejectedTopics,
    statistics.totalTopics,
  )
  const pendingRatio = getRatio(
    statistics.pendingTopics,
    statistics.totalTopics,
  )
  const summaryCards = [
    {
      label: 'Nhóm sinh viên',
      value: formatInteger(statistics.totalGroups),
      detail: selectedPeriodName,
      icon: UsersRound,
      tone: 'blue',
    },
    {
      label: 'Số bài nộp',
      value: formatInteger(statistics.totalSubmissions),
      detail: 'Tính theo hồ sơ bài nộp',
      icon: FileCheck2,
      tone: 'cyan',
    },
    {
      label: 'Điểm trung bình',
      value: formatScore(statistics.averageScore),
      detail:
        statistics.gradedGroupCount > 0
          ? `${statistics.gradedGroupCount} nhóm đã có kết quả`
          : 'Chưa có kết quả công bố',
      icon: Star,
      tone: 'amber',
    },
    {
      label: 'Đề tài được duyệt',
      value: formatInteger(statistics.approvedTopics),
      detail: `${approvedRatio}% tổng số đề tài`,
      icon: CheckCircle2,
      tone: 'green',
    },
    {
      label: 'Đề tài bị từ chối',
      value: formatInteger(statistics.rejectedTopics),
      detail: `${rejectedRatio}% tổng số đề tài`,
      icon: XCircle,
      tone: 'red',
    },
  ]

  return (
    <DashboardLayout title="THỐNG KÊ" contentClassName="statistics-content">
      {isLoading ? (
        <section className="statistics-state-card">
          <AppLoading label="Đang tổng hợp số liệu" />
        </section>
      ) : loadError ? (
        <section className="statistics-state-card statistics-error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadStatistics()}>
            Thử lại
          </button>
        </section>
      ) : (
        <>
          <section className="statistics-overview-head">
            <div>
              <span className="statistics-eyebrow">TỔNG QUAN ĐỒ ÁN</span>
              <h1>Số liệu học tập và tiến độ đề tài</h1>
              <p>
                Theo dõi nhóm sinh viên, bài nộp, trạng thái đề tài và kết quả
                đã được công bố.
              </p>
            </div>

            <div className="statistics-controls">
              <label htmlFor="statistics-period">Kỳ đăng ký</label>
              <div className="statistics-control-row">
                <select
                  id="statistics-period"
                  value={selectedPeriodId}
                  onChange={(event) => setSelectedPeriodId(event.target.value)}
                >
                  <option value="">Tất cả các kỳ</option>
                  {data.periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="statistics-refresh"
                  onClick={() => void loadStatistics()}
                  aria-label="Làm mới số liệu"
                  title="Làm mới số liệu"
                >
                  <RefreshCw size={18} aria-hidden="true" />
                </button>
              </div>
              {updatedAt && (
                <span className="statistics-updated-at">
                  Cập nhật lúc {formatTime(updatedAt)}
                </span>
              )}
            </div>
          </section>

          <section className="statistics-summary-grid" aria-label="Số liệu tổng quan">
            {summaryCards.map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.label}
                  className={`statistics-summary-card ${card.tone}`}
                >
                  <span className="statistics-summary-icon" aria-hidden="true">
                    <Icon size={23} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.detail}</span>
                  </div>
                </article>
              )
            })}
          </section>

          <div className="statistics-detail-grid">
            <section className="statistics-panel statistics-score-panel">
              <header className="statistics-panel-head">
                <div>
                  <span className="statistics-panel-icon" aria-hidden="true">
                    <BarChart3 size={19} />
                  </span>
                  <div>
                    <h2>Điểm trung bình theo kỳ</h2>
                    <p>Điểm kết quả cuối cùng đã công bố · Thang điểm 10</p>
                  </div>
                </div>
              </header>

              {periodAverages.length === 0 ? (
                <div className="statistics-empty">
                  Chưa có kỳ đăng ký để hiển thị.
                </div>
              ) : (
                <div className="statistics-chart-scroll">
                  <div className="statistics-chart">
                    {periodAverages.map((item) => {
                      const isSelected =
                        selectedPeriodId === String(item.period.id)
                      const height = item.averageScore === null
                        ? 3
                        : Math.max(3, item.averageScore * 10)

                      return (
                        <div
                          key={item.period.id}
                          className={`statistics-chart-item${isSelected ? ' selected' : ''}`}
                        >
                          <div className="statistics-chart-value-area">
                            <span
                              className="statistics-chart-value"
                              style={{ bottom: `calc(${height}% + 6px)` }}
                            >
                              {formatScore(item.averageScore)}
                            </span>
                            <div
                              className={`statistics-chart-bar${item.averageScore === null ? ' empty' : ''}`}
                              style={{ height: `${height}%` }}
                              role="img"
                              aria-label={`${item.period.name}: ${item.averageScore === null ? 'chưa có điểm' : `${formatScore(item.averageScore)} điểm`}`}
                            />
                          </div>
                          <strong title={item.period.name}>
                            {item.period.name}
                          </strong>
                          <span>{item.resultCount} kết quả</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="statistics-panel statistics-topic-panel">
              <header className="statistics-panel-head">
                <div>
                  <span className="statistics-panel-icon topic" aria-hidden="true">
                    <FileCheck2 size={19} />
                  </span>
                  <div>
                    <h2>Tình trạng đề tài</h2>
                    <p>{selectedPeriodName}</p>
                  </div>
                </div>
                <span className="statistics-topic-total">
                  {statistics.totalTopics} đề tài
                </span>
              </header>

              <div className="statistics-progress-list">
                <TopicProgress
                  label="Đã duyệt"
                  count={statistics.approvedTopics}
                  ratio={approvedRatio}
                  tone="approved"
                />
                <TopicProgress
                  label="Từ chối"
                  count={statistics.rejectedTopics}
                  ratio={rejectedRatio}
                  tone="rejected"
                />
                <TopicProgress
                  label="Chờ duyệt"
                  count={statistics.pendingTopics}
                  ratio={pendingRatio}
                  tone="pending"
                />
              </div>

              <div className="statistics-note">
                <strong>Cách tính:</strong> Đề tài đã duyệt bao gồm các trạng
                thái đã duyệt, đã công bố và đã đóng. Điểm trung bình chỉ lấy
                từ kết quả cuối cùng đã công bố.
              </div>
            </section>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

type TopicProgressProps = {
  label: string
  count: number
  ratio: number
  tone: 'approved' | 'rejected' | 'pending'
}

function TopicProgress({ label, count, ratio, tone }: TopicProgressProps) {
  return (
    <div className="statistics-progress-item">
      <div className="statistics-progress-label">
        <span>
          <i className={tone} aria-hidden="true" />
          {label}
        </span>
        <strong>
          {count} <small>({ratio}%)</small>
        </strong>
      </div>
      <div
        className="statistics-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ratio}
      >
        <span className={tone} style={{ width: `${ratio}%` }} />
      </div>
    </div>
  )
}

function calculateAverage(values: number[]) {
  if (values.length === 0) return null

  return values.reduce((total, value) => total + value, 0) / values.length
}

function getRatio(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatScore(value: number | null) {
  if (value === null) return '—'

  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Không thể tải dữ liệu thống kê.'
}
