import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CircleUser, Eye, Gavel, Lock, UserPlus, X } from 'lucide-react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { getLecturers } from '../../lecturers/services/lecturerApi'
import type { Lecturer } from '../../lecturers/types/lecturer.type'
import { getRegistrationPeriods } from '../../topics/services/registrationPeriodApi'
import type { RegistrationPeriod } from '../../topics/types/registrationPeriod.type'
import { AppLoading, Pagination } from '../../ui'
import {
  addCommitteeMember,
  closeDefenseCommittee,
  createDefenseCommittee,
  getDefenseCommittee,
  getDefenseCommittees,
  getDefenseCommitteesByRegistrationPeriod,
  getMyCommitteeMembers,
} from '../services/defenseCommitteeApi'
import type {
  CommitteeMember,
  CommitteeRole,
  DefenseCommittee,
  DefenseCommitteeStatus,
} from '../types/defenseCommittee.type'
import './DefenseCommitteesPage.css'

const PAGE_SIZE = 5

const statusConfig: Record<
  DefenseCommitteeStatus,
  { label: string; tone: 'active' | 'inactive' | 'closed' }
> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'active' },
  INACTIVE: { label: 'Ngừng hoạt động', tone: 'inactive' },
  CLOSED: { label: 'Đã đóng', tone: 'closed' },
}

const roleConfig: Record<CommitteeRole, { label: string; tone: string }> = {
  CHAIRMAN: { label: 'Chủ tịch', tone: 'chairman' },
  SECRETARY: { label: 'Thư ký', tone: 'secretary' },
  REVIEWER: { label: 'Phản biện', tone: 'reviewer' },
  MEMBER: { label: 'Thành viên', tone: 'member' },
}

const committeeRoles: CommitteeRole[] = [
  'CHAIRMAN',
  'SECRETARY',
  'REVIEWER',
  'MEMBER',
]

const emptyCommitteeForm = {
  registrationPeriodId: '',
  code: '',
  name: '',
}

export function DefenseCommitteesPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const canViewCommittees = isAdmin || isLecturer

  const [committees, setCommittees] = useState<DefenseCommittee[]>([])
  const [registrationPeriods, setRegistrationPeriods] = useState<
    RegistrationPeriod[]
  >([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [closingId, setClosingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [committeeForm, setCommitteeForm] = useState(emptyCommitteeForm)

  const [memberCommittee, setMemberCommittee] = useState<DefenseCommittee | null>(
    null,
  )
  const [memberLecturerId, setMemberLecturerId] = useState('')
  const [memberRole, setMemberRole] = useState<CommitteeRole>('MEMBER')

  const [detailCommittee, setDetailCommittee] = useState<DefenseCommittee | null>(
    null,
  )
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [isMyCommitteeOpen, setIsMyCommitteeOpen] = useState(false)
  const [myMemberships, setMyMemberships] = useState<CommitteeMember[]>([])
  const [isMyCommitteeLoading, setIsMyCommitteeLoading] = useState(false)

  const periodNameMap = useMemo(() => {
    return new Map(registrationPeriods.map((period) => [period.id, period.name]))
  }, [registrationPeriods])

  const visibleCommittees = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedCommittees = [...committees].sort(
      (first, second) => second.id - first.id,
    )

    if (!keyword) return sortedCommittees

    return sortedCommittees.filter((committee) => {
      const chairman = getChairman(committee)

      return [
        committee.id,
        committee.code,
        committee.name,
        committee.createdBy,
        statusConfig[committee.status]?.label,
        periodNameMap.get(committee.registrationPeriodId),
        chairman?.lecturerCode,
        chairman?.lecturerEmail,
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      )
    })
  }, [committees, periodNameMap, search])

  const totalPages = Math.max(1, Math.ceil(visibleCommittees.length / PAGE_SIZE))
  const pagedCommittees = visibleCommittees.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const [periodData, committeeData, lecturerData] = await Promise.all([
        getRegistrationPeriods(),
        selectedPeriodId
          ? getDefenseCommitteesByRegistrationPeriod(Number(selectedPeriodId))
          : getDefenseCommittees(),
        isAdmin ? getLecturers() : Promise.resolve([]),
      ])

      setRegistrationPeriods(periodData)
      setCommittees(committeeData)
      setLecturers(lecturerData)
    } catch (loadError) {
      const message = getErrorMessage(loadError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, selectedPeriodId, showError])

  useEffect(() => {
    if (!user) {
      window.location.href = '/'
      return
    }

    if (!canViewCommittees) {
      window.location.href = '/dashboard'
      return
    }

    void loadData()
  }, [canViewCommittees, loadData, user])

  useEffect(() => {
    setPage(1)
  }, [search, selectedPeriodId])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function updateCommittee(nextCommittee: DefenseCommittee) {
    setCommittees((current) =>
      current.map((committee) =>
        committee.id === nextCommittee.id ? nextCommittee : committee,
      ),
    )

    setDetailCommittee((current) =>
      current?.id === nextCommittee.id ? nextCommittee : current,
    )
  }

  function openCreateForm() {
    setCommitteeForm({ ...emptyCommitteeForm, registrationPeriodId: selectedPeriodId })
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
      const response = await createDefenseCommittee({
        registrationPeriodId: committeeForm.registrationPeriodId
          ? Number(committeeForm.registrationPeriodId)
          : undefined,
        code: committeeForm.code.trim(),
        name: committeeForm.name.trim(),
      })

      setCommittees((current) => [response.data, ...current])
      success(response.message)
      setIsCreateOpen(false)
    } catch (createError) {
      showError(getErrorMessage(createError))
    } finally {
      setIsSaving(false)
    }
  }

  function openMemberForm(committee: DefenseCommittee) {
    setMemberCommittee(committee)
    setMemberLecturerId('')
    setMemberRole('MEMBER')
  }

  function closeMemberForm() {
    if (isSaving) return
    setMemberCommittee(null)
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!memberCommittee) return

    try {
      setIsSaving(true)
      const response = await addCommitteeMember(memberCommittee.id, {
        lecturerId: memberLecturerId ? Number(memberLecturerId) : undefined,
        committeeRole: memberRole,
      })

      updateCommittee(response.data)
      success(response.message)
      setMemberCommittee(null)
    } catch (memberError) {
      showError(getErrorMessage(memberError))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetail(committee: DefenseCommittee) {
    try {
      setIsDetailLoading(true)
      setDetailCommittee(committee)
      const response = await getDefenseCommittee(committee.id)
      setDetailCommittee(response.data)
      updateCommittee(response.data)
    } catch (detailError) {
      showError(getErrorMessage(detailError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailCommittee(null)
  }

  async function handleClose(committee: DefenseCommittee) {
    const confirmed = await confirm({
      title: 'Đóng hội đồng',
      message: `Bạn có chắc muốn đóng hội đồng "${committee.name}" không? Sau khi đóng sẽ không thể thêm thành viên nữa.`,
      confirmText: 'Đóng hội đồng',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setClosingId(committee.id)
      const response = await closeDefenseCommittee(committee.id)
      updateCommittee(response.data)
      success(response.message)
    } catch (closeError) {
      showError(getErrorMessage(closeError))
    } finally {
      setClosingId(null)
    }
  }

  async function openMyCommittees() {
    try {
      setIsMyCommitteeLoading(true)
      setIsMyCommitteeOpen(true)
      setMyMemberships(await getMyCommitteeMembers())
    } catch (myCommitteeError) {
      showError(getErrorMessage(myCommitteeError))
    } finally {
      setIsMyCommitteeLoading(false)
    }
  }

  function closeMyCommittees() {
    if (isMyCommitteeLoading) return
    setIsMyCommitteeOpen(false)
  }

  const availableLecturers = useMemo(() => {
    if (!memberCommittee) return lecturers

    const memberIds = new Set(
      (memberCommittee.committeeMembers ?? []).map((member) => member.lecturerId),
    )

    return lecturers.filter((lecturer) => !memberIds.has(lecturer.userId))
  }, [lecturers, memberCommittee])

  return (
    <DashboardLayout
      title="QUẢN LÝ HỘI ĐỒNG BẢO VỆ"
      contentClassName="defense-committees-content"
    >
      <section className="defense-committees-panel">
        <div className="defense-committees-toolbar">
          <label className="defense-committee-filter">
            <span>Kỳ đăng ký</span>
            <select
              className="form-control"
              value={selectedPeriodId}
              onChange={(event) => setSelectedPeriodId(event.target.value)}
            >
              <option value="">Tất cả</option>
              {registrationPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>

          <label className="defense-committee-search">
            <span>Tìm kiếm</span>
            <span className="defense-committee-search-box">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã, tên hội đồng, chủ tịch..."
              />
            </span>
          </label>

          <div className="defense-committee-toolbar-actions">
            {isLecturer && (
              <button
                className="defense-committee-ghost-button"
                type="button"
                onClick={() => void openMyCommittees()}
              >
                <Gavel aria-hidden="true" size={17} strokeWidth={1.9} />
                Hội đồng của tôi
              </button>
            )}

            {isAdmin && (
              <button
                className="defense-committee-add-button"
                type="button"
                onClick={openCreateForm}
              >
                <span>+</span> Tạo hội đồng
              </button>
            )}
          </div>
        </div>

        {error && <div className="defense-committee-message error">{error}</div>}

        <div className="defense-committee-table-wrap">
          <table className="defense-committee-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hội đồng</th>
                <th>Tên hội đồng</th>
                <th>Kỳ đăng ký</th>
                <th>Chủ tịch</th>
                <th>Thành viên</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="defense-committee-empty" colSpan={8}>
                    <AppLoading />
                  </td>
                </tr>
              ) : pagedCommittees.length === 0 ? (
                <tr>
                  <td className="defense-committee-empty" colSpan={8}>
                    Không tìm thấy hội đồng bảo vệ.
                  </td>
                </tr>
              ) : (
                pagedCommittees.map((committee) => {
                  const members = committee.committeeMembers ?? []
                  const chairman = getChairman(committee)
                  const isClosed = committee.status === 'CLOSED'

                  return (
                    <tr
                      key={committee.id}
                      className={isClosed ? 'inactive-row' : ''}
                    >
                      <td>{committee.id}</td>
                      <td>
                        <span className="defense-committee-code">
                          {committee.code}
                        </span>
                      </td>
                      <td>
                        <span className="defense-committee-name">
                          {committee.name}
                        </span>
                        <span className="defense-committee-creator">
                          Tạo bởi: {committee.createdBy}
                        </span>
                      </td>
                      <td>
                        {periodNameMap.get(committee.registrationPeriodId) ??
                          `#${committee.registrationPeriodId}`}
                      </td>
                      <td>
                        {chairman ? (
                          <span className="defense-committee-chairman">
                            {chairman.lecturerCode}
                            <small>{chairman.lecturerEmail}</small>
                          </span>
                        ) : (
                          <span className="defense-committee-warning">
                            Chưa có chủ tịch
                          </span>
                        )}
                      </td>
                      <td>{members.length}</td>
                      <td>
                        <span
                          className={`defense-committee-status ${
                            statusConfig[committee.status]?.tone ?? 'inactive'
                          }`}
                        >
                          {statusConfig[committee.status]?.label ??
                            committee.status}
                        </span>
                      </td>
                      <td className="defense-committee-actions-cell">
                        <div className="defense-committee-actions">
                          <button
                            type="button"
                            onClick={() => void openDetail(committee)}
                          >
                            <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                            <span>Chi tiết</span>
                          </button>

                          {isAdmin && !isClosed && (
                            <>
                              <button
                                type="button"
                                className="add-member"
                                onClick={() => openMemberForm(committee)}
                              >
                                <UserPlus
                                  aria-hidden="true"
                                  size={16}
                                  strokeWidth={1.9}
                                />
                                <span>Thêm GV</span>
                              </button>

                              <button
                                type="button"
                                className="close-committee"
                                disabled={closingId !== null}
                                onClick={() => void handleClose(committee)}
                              >
                                <Lock
                                  aria-hidden="true"
                                  size={16}
                                  strokeWidth={1.9}
                                />
                                <span>
                                  {closingId === committee.id
                                    ? 'Đang đóng...'
                                    : 'Đóng'}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          ariaLabel="Phân trang hội đồng bảo vệ"
        />
      </section>

      {isCreateOpen && (
        <div
          className="defense-committee-modal-backdrop"
          onMouseDown={closeCreateForm}
          role="presentation"
        >
          <section
            className="defense-committee-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="defense-committee-form-title"
          >
            <div className="defense-committee-modal-header">
              <h3 id="defense-committee-form-title">Tạo hội đồng bảo vệ</h3>
              <button type="button" onClick={closeCreateForm} aria-label="Đóng">
                <X aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={(event) => void handleCreateSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="defense-committee-period">
                  Kỳ đăng ký
                </label>
                <select
                  className="form-control"
                  id="defense-committee-period"
                  required
                  value={committeeForm.registrationPeriodId}
                  onChange={(event) =>
                    setCommitteeForm({
                      ...committeeForm,
                      registrationPeriodId: event.target.value,
                    })
                  }
                >
                  <option value="">Chọn kỳ đăng ký</option>
                  {registrationPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="defense-committee-code">
                  Mã hội đồng
                </label>
                <input
                  className="form-control"
                  id="defense-committee-code"
                  autoFocus
                  required
                  maxLength={50}
                  value={committeeForm.code}
                  onChange={(event) =>
                    setCommitteeForm({ ...committeeForm, code: event.target.value })
                  }
                  placeholder="VD: HD01"
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="defense-committee-name">
                  Tên hội đồng
                </label>
                <input
                  className="form-control"
                  id="defense-committee-name"
                  required
                  maxLength={100}
                  value={committeeForm.name}
                  onChange={(event) =>
                    setCommitteeForm({ ...committeeForm, name: event.target.value })
                  }
                  placeholder="VD: Hội đồng bảo vệ số 1"
                />
              </div>

              <div className="defense-committee-note">
                Mã hội đồng không được trùng. Hội đồng mới tạo ở trạng thái đang
                hoạt động và chưa có thành viên.
              </div>

              <div className="defense-committee-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeCreateForm}
                >
                  Hủy
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang tạo...' : 'Tạo hội đồng'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {memberCommittee && (
        <div
          className="defense-committee-modal-backdrop"
          onMouseDown={closeMemberForm}
          role="presentation"
        >
          <section
            className="defense-committee-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="defense-committee-member-title"
          >
            <div className="defense-committee-modal-header">
              <h3 id="defense-committee-member-title">
                Thêm thành viên - {memberCommittee.code}
              </h3>
              <button type="button" onClick={closeMemberForm} aria-label="Đóng">
                <X aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={(event) => void handleMemberSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="defense-committee-lecturer">
                  Giảng viên
                </label>
                <select
                  className="form-control"
                  id="defense-committee-lecturer"
                  autoFocus
                  required
                  value={memberLecturerId}
                  onChange={(event) => setMemberLecturerId(event.target.value)}
                >
                  <option value="">Chọn giảng viên</option>
                  {availableLecturers.map((lecturer) => (
                    <option key={lecturer.userId} value={lecturer.userId}>
                      {lecturer.lecturerCode} - {lecturer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="defense-committee-role">
                  Vai trò trong hội đồng
                </label>
                <select
                  className="form-control"
                  id="defense-committee-role"
                  value={memberRole}
                  onChange={(event) =>
                    setMemberRole(event.target.value as CommitteeRole)
                  }
                >
                  {committeeRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleConfig[role].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="defense-committee-note">
                Mỗi giảng viên chỉ được thêm một lần vào cùng một hội đồng. Danh
                sách trên đã loại các giảng viên đang có trong hội đồng này.
              </div>

              <div className="defense-committee-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeMemberForm}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || availableLecturers.length === 0}
                >
                  {isSaving ? 'Đang thêm...' : 'Thêm thành viên'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailCommittee && (
        <div
          className="defense-committee-modal-backdrop"
          onMouseDown={closeDetail}
          role="presentation"
        >
          <section
            className="defense-committee-modal defense-committee-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="defense-committee-detail-title"
          >
            <div className="defense-committee-modal-header">
              <h3 id="defense-committee-detail-title">Chi tiết hội đồng</h3>
              <button type="button" onClick={closeDetail} aria-label="Đóng">
                <X aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="defense-committee-detail">
              {isDetailLoading ? (
                <AppLoading />
              ) : (
                <>
                  <dl className="defense-committee-detail-grid">
                    <dt>Mã hội đồng</dt>
                    <dd>{detailCommittee.code}</dd>
                    <dt>Tên hội đồng</dt>
                    <dd>{detailCommittee.name}</dd>
                    <dt>Kỳ đăng ký</dt>
                    <dd>
                      {periodNameMap.get(detailCommittee.registrationPeriodId) ??
                        `#${detailCommittee.registrationPeriodId}`}
                    </dd>
                    <dt>Trạng thái</dt>
                    <dd>
                      <span
                        className={`defense-committee-status ${
                          statusConfig[detailCommittee.status]?.tone ?? 'inactive'
                        }`}
                      >
                        {statusConfig[detailCommittee.status]?.label ??
                          detailCommittee.status}
                      </span>
                    </dd>
                    <dt>Người tạo</dt>
                    <dd>{detailCommittee.createdBy}</dd>
                  </dl>

                  <h4 className="defense-committee-subtitle">
                    Thành viên hội đồng (
                    {(detailCommittee.committeeMembers ?? []).length})
                  </h4>

                  <table className="defense-committee-member-table">
                    <thead>
                      <tr>
                        <th>Mã GV</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Ngày tham gia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailCommittee.committeeMembers ?? []).length === 0 ? (
                        <tr>
                          <td className="defense-committee-empty" colSpan={4}>
                            Hội đồng chưa có thành viên.
                          </td>
                        </tr>
                      ) : (
                        sortMembers(detailCommittee.committeeMembers).map(
                          (member) => (
                            <tr key={member.id}>
                              <td>{member.lecturerCode}</td>
                              <td>{member.lecturerEmail}</td>
                              <td>
                                <span
                                  className={`defense-committee-role ${
                                    roleConfig[member.committeeRole]?.tone ??
                                    'member'
                                  }`}
                                >
                                  {roleConfig[member.committeeRole]?.label ??
                                    member.committeeRole}
                                </span>
                              </td>
                              <td>{formatDateTime(member.joinedAt)}</td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {isMyCommitteeOpen && (
        <div
          className="defense-committee-modal-backdrop"
          onMouseDown={closeMyCommittees}
          role="presentation"
        >
          <section
            className="defense-committee-modal defense-committee-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="defense-committee-mine-title"
          >
            <div className="defense-committee-modal-header">
              <h3 id="defense-committee-mine-title">Hội đồng của tôi</h3>
              <button type="button" onClick={closeMyCommittees} aria-label="Đóng">
                <X aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="defense-committee-detail">
              {isMyCommitteeLoading ? (
                <AppLoading label="Đang tải hội đồng của tôi" />
              ) : myMemberships.length === 0 ? (
                <p className="defense-committee-mine-empty">
                  <CircleUser aria-hidden="true" size={18} strokeWidth={1.9} />
                  Bạn chưa được phân vào hội đồng nào.
                </p>
              ) : (
                <table className="defense-committee-member-table">
                  <thead>
                    <tr>
                      <th>Mã GV</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Ngày tham gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myMemberships.map((membership) => (
                      <tr key={membership.id}>
                        <td>{membership.lecturerCode}</td>
                        <td>{membership.lecturerEmail}</td>
                        <td>
                          <span
                            className={`defense-committee-role ${
                              roleConfig[membership.committeeRole]?.tone ??
                              'member'
                            }`}
                          >
                            {roleConfig[membership.committeeRole]?.label ??
                              membership.committeeRole}
                          </span>
                        </td>
                        <td>{formatDateTime(membership.joinedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

function getChairman(committee: DefenseCommittee) {
  return (committee.committeeMembers ?? []).find(
    (member) => member.committeeRole === 'CHAIRMAN',
  )
}

function sortMembers(members: CommitteeMember[]) {
  const rolePriority: Record<CommitteeRole, number> = {
    CHAIRMAN: 0,
    SECRETARY: 1,
    REVIEWER: 2,
    MEMBER: 3,
  }

  return [...members].sort(
    (first, second) =>
      rolePriority[first.committeeRole] - rolePriority[second.committeeRole],
  )
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
