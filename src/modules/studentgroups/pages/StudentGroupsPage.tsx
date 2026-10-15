import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Search, Trash2, X } from 'lucide-react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { getRegistrationPeriods } from '../../topics/services/registrationPeriodApi'
import type { RegistrationPeriod } from '../../topics/types/registrationPeriod.type'
import { AppLoading, Pagination } from '../../ui'
import {
  createStudentGroup,
  deleteStudentGroup,
  getMyStudentGroups,
  getStudentGroup,
  getStudentGroups,
  getStudentGroupsByRegistrationPeriod,
} from '../services/studentGroupApi'
import type { StudentGroup } from '../types/studentGroup.type'
import './StudentGroupsPage.css'

const PAGE_SIZE = 5

export function StudentGroupsPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const isStudent = hasRole(user?.roles, 'STUDENT')
  const canViewGroups = isAdmin || isLecturer
  const canCreateGroup = isStudent
  const canDeleteGroup = isAdmin
  const canSeeList = canViewGroups || isStudent

  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [registrationPeriods, setRegistrationPeriods] = useState<RegistrationPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailGroup, setDetailGroup] = useState<StudentGroup | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [formPeriodId, setFormPeriodId] = useState('')
  const [memberIds, setMemberIds] = useState('')

  const periodNameMap = useMemo(() => {
    return new Map(registrationPeriods.map((period) => [period.id, period.name]))
  }, [registrationPeriods])

  const visibleGroups = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedGroups = [...groups].sort((first, second) => second.id - first.id)

    if (!keyword) return sortedGroups

    return sortedGroups.filter((group) => {
      const periodName = periodNameMap.get(group.registrationPeriodId) ?? ''
      const leader = getGroupLeader(group)

      return [
        group.id,
        group.name,
        group.createdBy,
        group.status ? 'Đang hoạt động' : 'Không còn hoạt động',
        periodName,
        leader?.username,
        leader?.studentCode,
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      )
    })
  }, [groups, periodNameMap, search])

  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / PAGE_SIZE))
  const pagedGroups = visibleGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const periodsPromise = getRegistrationPeriods()
      const groupsPromise = canViewGroups
        ? selectedPeriodId
          ? getStudentGroupsByRegistrationPeriod(Number(selectedPeriodId))
          : getStudentGroups()
        : isStudent
          ? getMyStudentGroups()
          : Promise.resolve([])

      const [periodData, groupData] = await Promise.all([
        periodsPromise,
        groupsPromise,
      ])

      setRegistrationPeriods(periodData)
      setGroups(groupData)
    } catch (loadError) {
      const message = getErrorMessage(loadError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [canViewGroups, isStudent, selectedPeriodId, showError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [search, selectedPeriodId])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function openCreateForm() {
    setGroupName('')
    setFormPeriodId(selectedPeriodId)
    setMemberIds('')
    setIsFormOpen(true)
  }

  function closeCreateForm() {
    if (isSaving) return
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      const response = await createStudentGroup({
        registrationPeriodId: formPeriodId ? Number(formPeriodId) : undefined,
        name: groupName.trim(),
        memberUserIds: parseMemberIds(memberIds),
      })

      setGroups((current) => [response.data, ...current])
      success(response.message)
      closeCreateForm()
    } catch (createError) {
      showError(getErrorMessage(createError))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetail(group: StudentGroup) {
    if (!canSeeList) return

    if (!canViewGroups) {
      setDetailGroup(group)
      return
    }

    try {
      setIsDetailLoading(true)
      setDetailGroup(group)
      const response = await getStudentGroup(group.id)
      setDetailGroup(response.data)
    } catch (detailError) {
      showError(getErrorMessage(detailError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailGroup(null)
  }

  async function handleDelete(group: StudentGroup) {
    const confirmed = await confirm({
      title: 'Xóa nhóm sinh viên',
      message: `Bạn có chắc muốn xóa nhóm "${group.name}" không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setDeletingId(group.id)
      const response = await deleteStudentGroup(group.id)
      setGroups((current) => current.filter((item) => item.id !== group.id))
      success(response.message)
    } catch (deleteError) {
      showError(getErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DashboardLayout title="QUẢN LÝ NHÓM SINH VIÊN" contentClassName="student-groups-content">
      <section className="student-groups-panel">
        <div className="student-groups-toolbar">
          <label className="student-group-filter">
            <span>Kỳ đăng ký</span>
            <select
              className="form-control"
              value={selectedPeriodId}
              onChange={(event) => setSelectedPeriodId(event.target.value)}
              disabled={!canViewGroups}
            >
              <option value="">Tất cả</option>
              {registrationPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>

          <label className="student-group-search">
            <span>Tìm kiếm</span>
            <span className="student-group-search-box">
              <Search aria-hidden="true" size={17} strokeWidth={2} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên nhóm, mã nhóm, người tạo..."
                disabled={!canSeeList}
              />
            </span>
          </label>

          {canCreateGroup && (
            <button className="student-group-add-button" type="button" onClick={openCreateForm}>
              <span>+</span> Tạo nhóm
            </button>
          )}
        </div>

        {error && <div className="student-group-message error">{error}</div>}
        {!canViewGroups && canCreateGroup && (
          <div className="student-group-message info">
            Danh sách dưới đây là các nhóm bạn đang tham gia.
          </div>
        )}

        <div className="student-group-table-wrap">
          <table className="student-group-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên nhóm</th>
                <th>Kỳ đăng ký</th>
                <th>Số thành viên</th>
                <th>Trạng thái</th>
                <th>Trưởng nhóm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="student-group-empty" colSpan={7}><AppLoading /></td>
                </tr>
              ) : pagedGroups.length === 0 ? (
                <tr>
                  <td className="student-group-empty" colSpan={7}>
                    {canViewGroups
                      ? 'Không tìm thấy nhóm sinh viên.'
                      : 'Bạn chưa thuộc nhóm nào.'}
                  </td>
                </tr>
              ) : (
                pagedGroups.map((group) => {
                  const leader = getGroupLeader(group)

                  return (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>{group.name}</td>
                      <td>{periodNameMap.get(group.registrationPeriodId) ?? `#${group.registrationPeriodId}`}</td>
                      <td>{group.members.length}</td>
                      <td>
                        <span className={`student-group-status ${group.status ? 'active' : 'inactive'}`}>
                          {group.status ? 'Đang hoạt động' : 'Không còn hoạt động'}
                        </span>
                      </td>
                      <td>{leader ? `${leader.studentCode} - ${leader.username}` : group.createdBy}</td>
                      <td>
                        <div className="student-group-actions">
                          {canSeeList && (
                            <button type="button" onClick={() => void openDetail(group)}>
                              <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                              <span>Chi tiết</span>
                            </button>
                          )}
                          {canDeleteGroup && (
                            <button
                              type="button"
                              className="delete"
                              disabled={deletingId !== null}
                              onClick={() => void handleDelete(group)}
                            >
                              <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} /> <span>{deletingId === group.id ? 'Đang xóa...' : 'Xóa'}</span>
                            </button>
                          )}
                          {!canSeeList && !canDeleteGroup && (
                            <span className="student-group-action-empty">-</span>
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
          ariaLabel="Phân trang nhóm sinh viên"
        />
      </section>

      {isFormOpen && (
        <div className="student-group-modal-backdrop" onMouseDown={closeCreateForm} role="presentation">
          <section className="student-group-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-group-form-title">
            <div className="student-group-modal-header">
              <h3 id="student-group-form-title">Tạo nhóm sinh viên</h3>
              <button type="button" onClick={closeCreateForm} aria-label="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="student-group-period">Kỳ đăng ký</label>
                <select
                  className="form-control"
                  id="student-group-period"
                  value={formPeriodId}
                  onChange={(event) => setFormPeriodId(event.target.value)}
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
                <label className="form-label" htmlFor="student-group-name">Tên nhóm</label>
                <input
                  className="form-control"
                  id="student-group-name"
                  autoFocus
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Nhập tên nhóm"
                  maxLength={255}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="student-group-members">ID sinh viên thành viên</label>
                <input
                  className="form-control"
                  id="student-group-members"
                  value={memberIds}
                  onChange={(event) => setMemberIds(event.target.value)}
                  placeholder="Ví dụ: 2, 3"
                />
                <p className="student-group-help">Người tạo nhóm sẽ tự động là trưởng nhóm, không cần nhập ID của bạn.</p>
              </div>

              <div className="student-group-note">
                Mỗi nhóm tối đa 3 sinh viên tính cả trưởng nhóm. Mỗi sinh viên chỉ được thuộc một nhóm trong cùng kỳ đăng ký.
              </div>

              <div className="student-group-modal-actions">
                <button className="secondary" type="button" onClick={closeCreateForm}>Hủy</button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailGroup && (
        <div className="student-group-modal-backdrop" onMouseDown={closeDetail} role="presentation">
          <section className="student-group-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-group-detail-title">
            <div className="student-group-modal-header">
              <h3 id="student-group-detail-title">Chi tiết nhóm sinh viên</h3>
              <button type="button" onClick={closeDetail} aria-label="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
            </div>
            <div className="student-group-detail">
              {isDetailLoading ? (
                <AppLoading />
              ) : (
                <>
                  <dl className="student-group-detail-grid">
                    <dt>Tên nhóm</dt>
                    <dd>{detailGroup.name}</dd>
                    <dt>Kỳ đăng ký</dt>
                    <dd>{periodNameMap.get(detailGroup.registrationPeriodId) ?? `#${detailGroup.registrationPeriodId}`}</dd>
                    <dt>Trạng thái</dt>
                    <dd>
                      <span className={`student-group-status ${detailGroup.status ? 'active' : 'inactive'}`}>
                        {detailGroup.status ? 'Đang hoạt động' : 'Không còn hoạt động'}
                      </span>
                    </dd>
                    <dt>Người tạo</dt>
                    <dd>{detailGroup.createdBy}</dd>
                  </dl>

                  <table className="student-group-member-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Mã sinh viên</th>
                        <th>Vai trò</th>
                        <th>Ngày tham gia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailGroup.members.map((member) => (
                        <tr key={member.userId}>
                          <td>{member.userId}</td>
                          <td>{member.username}</td>
                          <td>{member.studentCode}</td>
                          <td>{member.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}</td>
                          <td>{formatDateTime(member.joinedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

function parseMemberIds(value: string) {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0)
}

function getGroupLeader(group: StudentGroup) {
  return group.members.find((member) => member.role === 'LEADER')
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
