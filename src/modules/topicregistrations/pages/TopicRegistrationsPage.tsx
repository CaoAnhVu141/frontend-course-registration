import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { getStudentGroups } from '../../studentgroups/services/studentGroupApi'
import type { StudentGroup } from '../../studentgroups/types/studentGroup.type'
import { getPublishedTopics, getTopics } from '../../topics/services/topicApi'
import type { Topic } from '../../topics/types/topic.type'
import { AppLoading, Pagination } from '../../ui'
import {
  approveTopicRegistration,
  cancelTopicRegistration,
  createTopicRegistration,
  getTopicRegistration,
  getTopicRegistrations,
  rejectTopicRegistration,
} from '../services/topicRegistrationApi'
import type {
  TopicRegistration,
  TopicRegistrationStatus,
} from '../types/topicRegistration.type'
import './TopicRegistrationsPage.css'

const PAGE_SIZE = 5

const statusConfig: Record<
  TopicRegistrationStatus,
  { label: string; tone: 'pending' | 'approved' | 'rejected' | 'cancelled' }
> = {
  PENDING: { label: 'Chờ duyệt', tone: 'pending' },
  APPROVED: { label: 'Đã duyệt', tone: 'approved' },
  REJECTED: { label: 'Đã từ chối', tone: 'rejected' },
  CANCELLED: { label: 'Đã hủy', tone: 'cancelled' },
}

export function TopicRegistrationsPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const isStudent = hasRole(user?.roles, 'STUDENT')
  const canReviewRegistrations = isAdmin || isLecturer
  const canCreateRegistration = isStudent

  const [registrations, setRegistrations] = useState<TopicRegistration[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formStudentGroupId, setFormStudentGroupId] = useState('')
  const [formTopicId, setFormTopicId] = useState('')
  const [rejectingRegistration, setRejectingRegistration] =
    useState<TopicRegistration | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [detailRegistration, setDetailRegistration] =
    useState<TopicRegistration | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const groupNameMap = useMemo(() => {
    return new Map(studentGroups.map((group) => [group.id, group.name]))
  }, [studentGroups])

  const topicNameMap = useMemo(() => {
    return new Map(topics.map((topic) => [topic.id, topic.title]))
  }, [topics])

  const visibleRegistrations = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedRegistrations = [...registrations].sort(
      (first, second) => second.id - first.id,
    )

    return sortedRegistrations.filter((registration) => {
      if (
        selectedGroupId &&
        registration.studentGroupId !== Number(selectedGroupId)
      ) {
        return false
      }

      if (selectedTopicId && registration.topicId !== Number(selectedTopicId)) {
        return false
      }

      if (!keyword) return true

      const statusLabel =
        statusConfig[registration.status]?.label ?? registration.status

      return [
        registration.id,
        registration.studentGroupId,
        registration.studentGroupName,
        registration.topicId,
        registration.topicTitle,
        registration.registeredBy,
        registration.decidedBy,
        registration.rejectionReason,
        statusLabel,
        formatDateTime(registration.registeredAt),
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      )
    })
  }, [registrations, search, selectedGroupId, selectedTopicId])

  const totalPages = Math.max(
    1,
    Math.ceil(visibleRegistrations.length / PAGE_SIZE),
  )
  const pagedRegistrations = visibleRegistrations.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const registrationPromise = canReviewRegistrations
        ? getTopicRegistrations()
        : Promise.resolve([])
      const groupPromise = canReviewRegistrations
        ? getStudentGroups()
        : Promise.resolve([])
      const topicPromise = canCreateRegistration
        ? getPublishedTopics()
        : getTopics()

      const [registrationData, groupData, topicData] = await Promise.all([
        registrationPromise,
        groupPromise,
        topicPromise,
      ])

      setRegistrations(registrationData)
      setStudentGroups(groupData)
      setTopics(topicData)
    } catch (loadError) {
      const message = getErrorMessage(loadError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [canCreateRegistration, canReviewRegistrations, showError])

  useEffect(() => {
    if (!user) {
      window.location.href = '/'
      return
    }

    if (!canReviewRegistrations && !canCreateRegistration) {
      window.location.href = '/dashboard'
      return
    }

    void loadData()
  }, [canCreateRegistration, canReviewRegistrations, loadData, user])

  useEffect(() => {
    setPage(1)
  }, [search, selectedGroupId, selectedTopicId])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function openCreateForm() {
    setFormStudentGroupId('')
    setFormTopicId(selectedTopicId)
    setIsCreateOpen(true)
  }

  function closeCreateForm() {
    if (isSaving) return
    setIsCreateOpen(false)
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      const response = await createTopicRegistration({
        studentGroupId: formStudentGroupId
          ? Number(formStudentGroupId)
          : undefined,
        topicId: formTopicId ? Number(formTopicId) : undefined,
      })

      setRegistrations((current) => [response.data, ...current])
      success(response.message)
      closeCreateForm()
    } catch (createError) {
      showError(getErrorMessage(createError))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetail(registration: TopicRegistration) {
    try {
      setIsDetailLoading(true)
      setDetailRegistration(registration)
      const response = await getTopicRegistration(registration.id)
      setDetailRegistration(response.data)
    } catch (detailError) {
      showError(getErrorMessage(detailError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailRegistration(null)
  }

  async function handleApprove(registration: TopicRegistration) {
    try {
      setIsSaving(true)
      const response = await approveTopicRegistration(registration.id)
      updateRegistration(response.data)
      success(response.message)
    } catch (approveError) {
      showError(getErrorMessage(approveError))
    } finally {
      setIsSaving(false)
    }
  }

  function openRejectForm(registration: TopicRegistration) {
    setRejectingRegistration(registration)
    setRejectionReason('')
  }

  function closeRejectForm() {
    if (isSaving) return
    setRejectingRegistration(null)
  }

  async function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectingRegistration) return

    try {
      setIsSaving(true)
      const response = await rejectTopicRegistration(rejectingRegistration.id, {
        rejectionReason: rejectionReason.trim(),
      })
      updateRegistration(response.data)
      success(response.message)
      closeRejectForm()
    } catch (rejectError) {
      showError(getErrorMessage(rejectError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancel(registration: TopicRegistration) {
    const confirmed = await confirm({
      title: 'Hủy đăng ký đề tài',
      message: `Bạn có chắc muốn hủy đăng ký đề tài "${registration.topicTitle}" không?`,
      confirmText: 'Hủy đăng ký',
      cancelText: 'Đóng',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setIsSaving(true)
      const response = await cancelTopicRegistration(registration.id)
      updateRegistration(response.data)
      success(response.message)
    } catch (cancelError) {
      showError(getErrorMessage(cancelError))
    } finally {
      setIsSaving(false)
    }
  }

  function updateRegistration(nextRegistration: TopicRegistration) {
    setRegistrations((current) =>
      current.map((registration) =>
        registration.id === nextRegistration.id
          ? nextRegistration
          : registration,
      ),
    )
  }

  return (
    <DashboardLayout
      title="QUẢN LÝ ĐĂNG KÝ ĐỀ TÀI"
      contentClassName="topic-registrations-content"
    >
      <section className="topic-registrations-panel">
        <div className="topic-registrations-toolbar">
          {canReviewRegistrations && (
            <>
              <label className="topic-registration-filter">
                <span>Nhóm sinh viên</span>
                <select
                  className="form-control"
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {studentGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="topic-registration-filter">
                <span>Đề tài</span>
                <select
                  className="form-control"
                  value={selectedTopicId}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="topic-registration-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm đăng ký..."
              type="search"
            />
          </label>

          {canCreateRegistration && (
            <button
              className="topic-registration-add-button"
              type="button"
              onClick={openCreateForm}
            >
              <span>+</span> Đăng ký đề tài
            </button>
          )}
        </div>

        {error && <div className="topic-registration-message error">{error}</div>}
        {!canReviewRegistrations && canCreateRegistration && (
          <div className="topic-registration-message info">
            Sinh viên có thể tạo đăng ký mới và hủy các đăng ký vừa tạo trong
            phiên hiện tại. Danh sách toàn bộ đăng ký sẽ do quản trị viên hoặc
            giảng viên xem.
          </div>
        )}

        <div className="topic-registration-table-wrap">
          <table className="topic-registration-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Nhóm sinh viên</th>
                <th>Đề tài</th>
                <th>Người đăng ký</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th>Người quyết định</th>
                <th>Lý do</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="topic-registration-empty" colSpan={9}>
                    <AppLoading />
                  </td>
                </tr>
              ) : pagedRegistrations.length === 0 ? (
                <tr>
                  <td className="topic-registration-empty" colSpan={9}>
                    {canReviewRegistrations
                      ? 'Không tìm thấy đăng ký đề tài.'
                      : 'Chưa có đăng ký đề tài trong phiên này.'}
                  </td>
                </tr>
              ) : (
                pagedRegistrations.map((registration) => (
                  <tr
                    key={registration.id}
                    className={
                      registration.status === 'REJECTED' ||
                      registration.status === 'CANCELLED'
                        ? 'inactive-row'
                        : undefined
                    }
                  >
                    <td>{registration.id}</td>
                    <td>
                      {groupNameMap.get(registration.studentGroupId) ??
                        registration.studentGroupName ??
                        `#${registration.studentGroupId}`}
                    </td>
                    <td>
                      <span className="topic-registration-title">
                        {topicNameMap.get(registration.topicId) ??
                          registration.topicTitle ??
                          `#${registration.topicId}`}
                      </span>
                    </td>
                    <td>{registration.registeredBy}</td>
                    <td>{formatDateTime(registration.registeredAt)}</td>
                    <td>
                      <span
                        className={`topic-registration-status ${
                          statusConfig[registration.status].tone
                        }`}
                      >
                        {statusConfig[registration.status].label}
                      </span>
                    </td>
                    <td>{registration.decidedBy || '-'}</td>
                    <td>
                      <span
                        className={`topic-registration-reason ${
                          registration.rejectionReason ? '' : 'empty'
                        }`.trim()}
                      >
                        {registration.rejectionReason || '-'}
                      </span>
                    </td>
                    <td className="topic-registration-actions-cell">
                      <div className="topic-registration-actions">
                        {renderActions({
                          registration,
                          canReviewRegistrations,
                          canCreateRegistration,
                          isSaving,
                          openDetail,
                          handleApprove,
                          openRejectForm,
                          handleCancel,
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          ariaLabel="Phân trang đăng ký đề tài"
        />
      </section>

      {isCreateOpen && (
        <div
          className="topic-registration-modal-backdrop"
          onMouseDown={closeCreateForm}
          role="presentation"
        >
          <section
            className="topic-registration-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-registration-form-title"
          >
            <div className="topic-registration-modal-header">
              <h3 id="topic-registration-form-title">Đăng ký đề tài</h3>
              <button type="button" onClick={closeCreateForm} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={(event) => void handleCreateSubmit(event)}>
              <div className="form-field">
                <label
                  className="form-label"
                  htmlFor="topic-registration-group"
                >
                  ID nhóm sinh viên
                </label>
                <input
                  className="form-control"
                  id="topic-registration-group"
                  autoFocus
                  min={1}
                  required
                  type="number"
                  value={formStudentGroupId}
                  onChange={(event) =>
                    setFormStudentGroupId(event.target.value)
                  }
                  placeholder="Nhập ID nhóm sinh viên"
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="topic-registration-topic">
                  Đề tài đã công bố
                </label>
                <select
                  className="form-control"
                  id="topic-registration-topic"
                  required
                  value={formTopicId}
                  onChange={(event) => setFormTopicId(event.target.value)}
                >
                  <option value="">Chọn đề tài</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="topic-registration-note">
                Một nhóm sinh viên chỉ được đăng ký một đề tài đã công bố trong
                cùng kỳ đăng ký. Đăng ký mới sẽ ở trạng thái chờ duyệt.
              </div>

              <div className="topic-registration-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeCreateForm}
                >
                  Hủy
                </button>
                <button type="submit" disabled={isSaving || topics.length === 0}>
                  {isSaving ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {rejectingRegistration && (
        <div
          className="topic-registration-modal-backdrop"
          onMouseDown={closeRejectForm}
          role="presentation"
        >
          <section
            className="topic-registration-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-registration-reject-title"
          >
            <div className="topic-registration-modal-header">
              <h3 id="topic-registration-reject-title">
                Từ chối đăng ký đề tài
              </h3>
              <button type="button" onClick={closeRejectForm} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={(event) => void handleRejectSubmit(event)}>
              <div className="form-field">
                <label
                  className="form-label"
                  htmlFor="topic-registration-rejection-reason"
                >
                  Lý do từ chối
                </label>
                <textarea
                  className="form-control"
                  id="topic-registration-rejection-reason"
                  autoFocus
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Nhập lý do từ chối"
                />
              </div>

              <div className="topic-registration-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeRejectForm}
                >
                  Hủy
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailRegistration && (
        <div
          className="topic-registration-modal-backdrop"
          onMouseDown={closeDetail}
          role="presentation"
        >
          <section
            className="topic-registration-modal topic-registration-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-registration-detail-title"
          >
            <div className="topic-registration-modal-header">
              <h3 id="topic-registration-detail-title">
                Chi tiết đăng ký đề tài
              </h3>
              <button type="button" onClick={closeDetail} aria-label="Đóng">
                ×
              </button>
            </div>
            <div className="topic-registration-detail">
              {isDetailLoading ? (
                <AppLoading />
              ) : (
                <dl className="topic-registration-detail-grid">
                  <dt>ID đăng ký</dt>
                  <dd>{detailRegistration.id}</dd>
                  <dt>Nhóm sinh viên</dt>
                  <dd>
                    {detailRegistration.studentGroupName ||
                      `#${detailRegistration.studentGroupId}`}
                  </dd>
                  <dt>Đề tài</dt>
                  <dd>
                    {detailRegistration.topicTitle ||
                      `#${detailRegistration.topicId}`}
                  </dd>
                  <dt>Trạng thái</dt>
                  <dd>
                    <span
                      className={`topic-registration-status ${
                        statusConfig[detailRegistration.status].tone
                      }`}
                    >
                      {statusConfig[detailRegistration.status].label}
                    </span>
                  </dd>
                  <dt>Người đăng ký</dt>
                  <dd>{detailRegistration.registeredBy}</dd>
                  <dt>Ngày đăng ký</dt>
                  <dd>{formatDateTime(detailRegistration.registeredAt)}</dd>
                  <dt>Người quyết định</dt>
                  <dd>{detailRegistration.decidedBy || '-'}</dd>
                  <dt>Lý do từ chối</dt>
                  <dd>{detailRegistration.rejectionReason || '-'}</dd>
                </dl>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

type ActionProps = {
  registration: TopicRegistration
  canReviewRegistrations: boolean
  canCreateRegistration: boolean
  isSaving: boolean
  openDetail: (registration: TopicRegistration) => Promise<void>
  handleApprove: (registration: TopicRegistration) => Promise<void>
  openRejectForm: (registration: TopicRegistration) => void
  handleCancel: (registration: TopicRegistration) => Promise<void>
}

function renderActions({
  registration,
  canReviewRegistrations,
  canCreateRegistration,
  isSaving,
  openDetail,
  handleApprove,
  openRejectForm,
  handleCancel,
}: ActionProps) {
  const actions: ReactNode[] = [
    <button
      type="button"
      key="detail"
      onClick={() => void openDetail(registration)}
    >
      ◉ <span>Chi tiết</span>
    </button>,
  ]

  if (canReviewRegistrations && registration.status === 'PENDING') {
    actions.push(
      <button
        type="button"
        className="approve"
        disabled={isSaving}
        key="approve"
        onClick={() => void handleApprove(registration)}
      >
        ✓ <span>Duyệt</span>
      </button>,
      <button
        type="button"
        className="reject"
        disabled={isSaving}
        key="reject"
        onClick={() => openRejectForm(registration)}
      >
        ! <span>Từ chối</span>
      </button>,
    )
  }

  if (canCreateRegistration && registration.status === 'PENDING') {
    actions.push(
      <button
        type="button"
        className="cancel"
        disabled={isSaving}
        key="cancel"
        onClick={() => void handleCancel(registration)}
      >
        × <span>Hủy</span>
      </button>,
    )
  }

  return actions
}

function formatDateTime(value: string) {
  if (!value) return '-'

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
