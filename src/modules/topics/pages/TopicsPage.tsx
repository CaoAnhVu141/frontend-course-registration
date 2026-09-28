import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Check, Megaphone, Pencil, Search, Trash2, X, XCircle } from 'lucide-react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { getDepartments } from '../../departments/services/departmentApi'
import type { Department } from '../../departments/types/department.type'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading, Pagination } from '../../ui'
import {
  approveTopic,
  createTopic,
  deleteTopic,
  getTopics,
  publishTopic,
  rejectTopic,
  updateTopic,
} from '../services/topicApi'
import { getRegistrationPeriods } from '../services/registrationPeriodApi'
import type { RegistrationPeriod } from '../types/registrationPeriod.type'
import type { Topic, TopicRequest, TopicStatus } from '../types/topic.type'
import './TopicsPage.css'

const PAGE_SIZE = 5

const statusConfig: Record<
  TopicStatus,
  { label: string; tone: 'active' | 'inactive' | 'pending' | 'approved' }
> = {
  PENDING: { label: 'Chờ duyệt', tone: 'pending' },
  APPROVED: { label: 'Đã duyệt', tone: 'approved' },
  REJECTED: { label: 'Bị từ chối', tone: 'inactive' },
  PUBLISHED: { label: 'Đang hoạt động', tone: 'active' },
  CLOSED: { label: 'Không còn hoạt động', tone: 'inactive' },
}

export function TopicsPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const canManageTopics = isAdmin || isLecturer

  const [topics, setTopics] = useState<Topic[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [registrationPeriods, setRegistrationPeriods] = useState<RegistrationPeriod[]>([])
  const [search, setSearch] = useState('')
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rejectingTopic, setRejectingTopic] = useState<Topic | null>(null)
  const [title, setTitle] = useState('')
  const [requirements, setRequirements] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [registrationPeriodId, setRegistrationPeriodId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const departmentNameMap = useMemo(() => {
    return new Map(departments.map((department) => [
      department.departmentId,
      department.name,
    ]))
  }, [departments])

  const registrationPeriodNameMap = useMemo(() => {
    return new Map(registrationPeriods.map((period) => [period.id, period.name]))
  }, [registrationPeriods])

  const visibleTopics = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedTopics = [...topics].sort((first, second) => second.id - first.id)

    if (!keyword) return sortedTopics

    return sortedTopics.filter((topic) => {
      const statusLabel = statusConfig[topic.status]?.label ?? topic.status
      const departmentName = departmentNameMap.get(topic.departmentId) ?? ''
      const periodName = registrationPeriodNameMap.get(topic.registrationPeriodId) ?? ''

      return [
        topic.id,
        topic.title,
        topic.requirements,
        topic.rejectionReason,
        topic.proposedBy,
        statusLabel,
        departmentName,
        periodName,
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      )
    })
  }, [departmentNameMap, registrationPeriodNameMap, search, topics])

  const totalPages = Math.max(1, Math.ceil(visibleTopics.length / PAGE_SIZE))
  const pagedTopics = visibleTopics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const loadTopics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const [topicData, departmentData, periodData] = await Promise.all([
        getTopics(),
        getDepartments(),
        getRegistrationPeriods(),
      ])

      setTopics(topicData)
      setDepartments(departmentData)
      setRegistrationPeriods(periodData)
    } catch (loadError) {
      const message = getErrorMessage(loadError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadTopics()
  }, [loadTopics])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function openCreateForm() {
    setEditingTopic(null)
    setTitle('')
    setRequirements('')
    setDepartmentId('')
    setRegistrationPeriodId('')
    setIsFormOpen(true)
  }

  function openEditForm(topic: Topic) {
    setEditingTopic(topic)
    setTitle(topic.title)
    setRequirements(topic.requirements ?? '')
    setDepartmentId(String(topic.departmentId))
    setRegistrationPeriodId(String(topic.registrationPeriodId))
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: TopicRequest = {
      title: title.trim(),
      requirements: requirements.trim(),
      departmentId: departmentId ? Number(departmentId) : undefined,
      registrationPeriodId: registrationPeriodId
        ? Number(registrationPeriodId)
        : undefined,
    }

    try {
      setIsSaving(true)
      const response = editingTopic
        ? await updateTopic(editingTopic.id, payload)
        : await createTopic(payload)

      setTopics((current) => {
        if (editingTopic) {
          return current.map((topic) =>
            topic.id === editingTopic.id ? response.data : topic,
          )
        }

        return [response.data, ...current]
      })

      success(response.message)
      closeForm()
    } catch (saveError) {
      showError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(topic: Topic) {
    const confirmed = await confirm({
      title: 'Xóa đề tài',
      message: `Bạn có chắc muốn xóa đề tài "${topic.title}" không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await deleteTopic(topic.id)
      setTopics((current) => current.filter((item) => item.id !== topic.id))
      success(response.message)
    } catch (deleteError) {
      showError(getErrorMessage(deleteError))
    }
  }

  async function handleStatusAction(
    topic: Topic,
    action: (topicId: number) => Promise<{ message: string; data: Topic }>,
  ) {
    try {
      const response = await action(topic.id)
      setTopics((current) =>
        current.map((item) => (item.id === topic.id ? response.data : item)),
      )
      success(response.message)
    } catch (statusError) {
      showError(getErrorMessage(statusError))
    }
  }

  function openRejectForm(topic: Topic) {
    setRejectingTopic(topic)
    setRejectReason('')
  }

  function closeRejectForm() {
    if (isSaving) return
    setRejectingTopic(null)
  }

  async function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectingTopic) return

    try {
      setIsSaving(true)
      const response = await rejectTopic(rejectingTopic.id, rejectReason.trim())
      setTopics((current) =>
        current.map((topic) =>
          topic.id === rejectingTopic.id ? response.data : topic,
        ),
      )
      success(response.message)
      closeRejectForm()
    } catch (rejectError) {
      showError(getErrorMessage(rejectError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout title="QUẢN LÝ ĐỀ TÀI" contentClassName="topics-content">
      <section className="topics-panel">
        <div className="topics-toolbar">
          <label className="topic-search">
            <Search aria-hidden="true" size={17} strokeWidth={2} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm đề tài..."
              type="search"
            />
          </label>
          {canManageTopics && (
            <button
              className="topic-add-button"
              type="button"
              disabled={!isLecturer}
              onClick={openCreateForm}
              title={isLecturer ? 'Thêm đề tài' : 'Chỉ giảng viên mới được tạo đề tài'}
            >
              <span>+</span> Thêm đề tài
            </button>
          )}
        </div>

        {error && <div className="topic-message error">{error}</div>}

        <div className="topic-table-wrap">
          <table className="topic-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên đề tài</th>
                <th>Khoa / phòng ban</th>
                <th>Kỳ đăng ký</th>
                <th>Người đề xuất</th>
                <th>Trạng thái</th>
                <th>Lý do</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="topic-empty" colSpan={8}><AppLoading /></td>
                </tr>
              ) : pagedTopics.length === 0 ? (
                <tr>
                  <td className="topic-empty" colSpan={8}>Không tìm thấy đề tài phù hợp.</td>
                </tr>
              ) : (
                pagedTopics.map((topic) => (
                  <tr key={topic.id} className={isInactiveTopic(topic) ? 'inactive-row' : ''}>
                    <td>{topic.id}</td>
                    <td>
                      <div className="topic-title">{topic.title}</div>
                    </td>
                    <td>{departmentNameMap.get(topic.departmentId) ?? `#${topic.departmentId}`}</td>
                    <td>{registrationPeriodNameMap.get(topic.registrationPeriodId) ?? `#${topic.registrationPeriodId}`}</td>
                    <td>
                      <span className="topic-proposed-by">{topic.proposedBy}</span>
                    </td>
                    <td>
                      <span className={`topic-status ${statusConfig[topic.status].tone}`}>
                        {statusConfig[topic.status].label}
                      </span>
                    </td>
                    <td>
                      <span className={`topic-reason ${topic.rejectionReason ? '' : 'empty'}`.trim()}>
                        {topic.rejectionReason || '-'}
                      </span>
                    </td>
                    <td className="topic-actions">
                      <div className="topic-action-list">
                        {renderActions({
                          topic,
                          isAdmin,
                          isLecturer,
                          openEditForm,
                          handleDelete,
                          handleStatusAction,
                          openRejectForm,
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
        />
      </section>

      {isFormOpen && (
        <div className="topic-modal-backdrop" onMouseDown={closeForm} role="presentation">
          <section className="topic-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="topic-form-title">
            <div className="topic-modal-header">
              <h3 id="topic-form-title">{editingTopic ? 'Cập nhật đề tài' : 'Thêm đề tài'}</h3>
              <button type="button" onClick={closeForm} aria-label="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="topic-title">Tên đề tài</label>
                <input
                  className="form-control"
                  id="topic-title"
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Nhập tên đề tài"
                  maxLength={255}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="topic-requirements">Yêu cầu</label>
                <textarea
                  className="form-control"
                  id="topic-requirements"
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  placeholder="Nhập yêu cầu đề tài"
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="topic-department">Khoa / phòng ban</label>
                <select
                  className="form-control"
                  id="topic-department"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                >
                  <option value="">Chọn khoa / phòng ban</option>
                  {departments.map((department) => (
                    <option key={department.departmentId} value={department.departmentId}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="topic-period">Kỳ đăng ký</label>
                <select
                  className="form-control"
                  id="topic-period"
                  value={registrationPeriodId}
                  onChange={(event) => setRegistrationPeriodId(event.target.value)}
                >
                  <option value="">Chọn kỳ đăng ký</option>
                  {registrationPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="topic-modal-actions">
                <button className="secondary" type="button" onClick={closeForm}>Hủy</button>
                <button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Đang lưu...'
                    : editingTopic
                      ? 'Cập nhật'
                      : 'Tạo đề tài'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {rejectingTopic && (
        <div className="topic-modal-backdrop" onMouseDown={closeRejectForm} role="presentation">
          <section className="topic-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="topic-reject-title">
            <div className="topic-modal-header">
              <h3 id="topic-reject-title">Từ chối đề tài</h3>
              <button type="button" onClick={closeRejectForm} aria-label="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
            </div>
            <form onSubmit={(event) => void handleRejectSubmit(event)}>
              <label htmlFor="topic-reject-reason">Lý do từ chối</label>
              <textarea
                id="topic-reject-reason"
                autoFocus
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhập lý do"
                rows={4}
              />
              <div className="topic-modal-actions">
                <button className="secondary" type="button" onClick={closeRejectForm}>Hủy</button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

type TopicActionProps = {
  topic: Topic
  isAdmin: boolean
  isLecturer: boolean
  openEditForm: (topic: Topic) => void
  handleDelete: (topic: Topic) => Promise<void>
  handleStatusAction: (
    topic: Topic,
    action: (topicId: number) => Promise<{ message: string; data: Topic }>,
  ) => Promise<void>
  openRejectForm: (topic: Topic) => void
}

function renderActions({
  topic,
  isAdmin,
  isLecturer,
  openEditForm,
  handleDelete,
  handleStatusAction,
  openRejectForm,
}: TopicActionProps) {
  const actions: ReactNode[] = []

  if ((isAdmin || isLecturer) && topic.status !== 'PUBLISHED') {
    actions.push(
      <button type="button" key="edit" onClick={() => openEditForm(topic)}>
        <Pencil aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Sửa</span>
      </button>,
    )
  }

  if (isAdmin && topic.status === 'PENDING') {
    actions.push(
      <button
        type="button"
        className="approve"
        key="approve"
        onClick={() => void handleStatusAction(topic, approveTopic)}
      >
        <Check aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Duyệt</span>
      </button>,
      <button
        type="button"
        className="reject"
        key="reject"
        onClick={() => openRejectForm(topic)}
      >
        <XCircle aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Từ chối</span>
      </button>,
    )
  }

  if (isAdmin && topic.status === 'APPROVED') {
    actions.push(
      <button
        type="button"
        className="publish"
        key="publish"
        onClick={() => void handleStatusAction(topic, publishTopic)}
      >
        <Megaphone aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Công bố</span>
      </button>,
    )
  }

  if (isAdmin && topic.status !== 'PUBLISHED') {
    actions.push(
      <button
        type="button"
        className="delete"
        key="delete"
        onClick={() => void handleDelete(topic)}
      >
        <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Xóa</span>
      </button>,
    )
  }

  return actions.length ? actions : <span className="topic-action-empty">-</span>
}

function isInactiveTopic(topic: Topic) {
  return topic.status === 'REJECTED' || topic.status === 'CLOSED'
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra'
}
