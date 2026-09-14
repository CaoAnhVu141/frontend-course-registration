import { useEffect, useMemo, useState } from 'react'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import {
  createLecturer,
  deleteLecturer,
  getLecturers,
  updateLecturer,
} from '../services/lecturerApi'
import { getExpertiseTags } from '../services/expertiseTagApi'
import type { Lecturer } from '../types/lecturer.type'
import type { ExpertiseTag } from '../types/expertiseTag.type'
import './LecturersPage.css'

const PAGE_SIZE = 5

export function LecturersPage() {
  const user = tokenStorage.getUser()
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()

  const isAdmin = hasRole(user?.roles, 'ADMIN')

  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [expertiseTags, setExpertiseTags] = useState<ExpertiseTag[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lecturerCode, setLecturerCode] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [academicTitle, setAcademicTitle] = useState('')
  const [maxReviewLoad, setMaxReviewLoad] = useState('')
  const [expertiseTagIds, setExpertiseTagIds] = useState('')

  const filteredLecturers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const matchingLecturers = !keyword
      ? lecturers
      : lecturers.filter((lecturer) =>
          [
            lecturer.username,
            lecturer.email,
            lecturer.lecturerCode,
            lecturer.academicTitle,
          ]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase('vi').includes(keyword)),
        )

    return [...matchingLecturers].sort(
      (firstLecturer, secondLecturer) => secondLecturer.userId - firstLecturer.userId,
    )
  }, [lecturers, search])

  const totalPages = Math.max(1, Math.ceil(filteredLecturers.length / PAGE_SIZE))
  const visibleLecturers = filteredLecturers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const expertiseTagNameMap = useMemo(() => {
    return new Map(expertiseTags.map((tag) => [tag.id, tag.name]))
  }, [expertiseTags])

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    void loadLecturers()
  }, [isAdmin])

  useEffect(() => {
    setPage(1)
  }, [search])

  async function loadLecturers() {
    setIsLoading(true)
    setError('')

    try {
      const [lecturerData, expertiseTagData] = await Promise.all([
        getLecturers(),
        getExpertiseTags(),
      ])

      setLecturers(lecturerData)
      setExpertiseTags(expertiseTagData)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingLecturer(null)
    setUsername('')
    setEmail('')
    setPassword('')
    setLecturerCode('')
    setDepartmentId('')
    setAcademicTitle('')
    setMaxReviewLoad('')
    setExpertiseTagIds('')
    setError('')
    setIsFormOpen(true)
  }

  function openEditForm(lecturer: Lecturer) {
    setEditingLecturer(lecturer)
    setUsername(lecturer.username)
    setEmail(lecturer.email)
    setPassword('')
    setLecturerCode(lecturer.lecturerCode)
    setDepartmentId(String(lecturer.departmentId ?? ''))
    setAcademicTitle(lecturer.academicTitle ?? '')
    setMaxReviewLoad(String(lecturer.maxReviewLoad ?? ''))
    setExpertiseTagIds((lecturer.expertiseTagIds ?? []).join(', '))
    setError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSaving(true)

    const payload = {
      lecturerCode: lecturerCode.trim(),
      departmentId: parseOptionalNumber(departmentId),
      academicTitle: academicTitle.trim(),
      maxReviewLoad: parseOptionalNumber(maxReviewLoad),
      expertiseTagIds: parseNumberList(expertiseTagIds),
    }

    try {
      if (editingLecturer) {
        const response = await updateLecturer(editingLecturer.userId, payload)

        setLecturers((current) =>
          current.map((item) =>
            item.userId === response.data.userId ? response.data : item,
          ),
        )

        success(response.message)
      } else {
        const response = await createLecturer({
          username: username.trim(),
          email: email.trim(),
          password,
          ...payload,
        })

        setLecturers((current) => [...current, response.data])
        success(response.message)
      }

      setIsFormOpen(false)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(lecturer: Lecturer) {
    const shouldDelete = await confirm({
      title: 'Xóa giảng viên',
      message: `Bạn có chắc muốn xóa "${lecturer.email}" không? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!shouldDelete) return

    try {
      const response = await deleteLecturer(lecturer.userId)

      setLecturers((current) =>
        current.filter((item) => item.userId !== lecturer.userId),
      )

      success(response.message)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    }
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  if (!isAdmin) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <DashboardLayout title="QUẢN LÝ GIẢNG VIÊN" contentClassName="lecturers-content">
      <>
          <section className="lecturers-panel">
            <div className="lecturers-toolbar">
              <label className="lecturer-search">
                <span>⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm giảng viên..."
                />
              </label>

              <button className="lecturer-add-button" type="button" onClick={openCreateForm}>
                <span>+</span> Thêm mới
              </button>
            </div>

            {error && <div className="lecturer-message error">{error}</div>}

            <div className="lecturer-table-wrap">
              <table className="lecturer-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã GV</th>
                    <th>Email</th>
                    <th>Khoa/Phòng ban</th>
                    <th>Học hàm/học vị</th>
                    <th>Tải phản biện</th>
                    <th>Chuyên môn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="lecturer-empty">Đang tải dữ liệu...</td></tr>
                  ) : visibleLecturers.length === 0 ? (
                    <tr><td colSpan={8} className="lecturer-empty">Không tìm thấy giảng viên.</td></tr>
                  ) : (
                    visibleLecturers.map((lecturer) => (
                      <tr key={lecturer.userId}>
                        <td>{lecturer.userId}</td>
                        <td>{lecturer.lecturerCode}</td>
                        <td>{lecturer.email}</td>
                        <td>{lecturer.departmentId}</td>
                        <td>{lecturer.academicTitle || '-'}</td>
                        <td>{lecturer.maxReviewLoad}</td>
                        <td>{getExpertiseNames(lecturer.expertiseTagIds, expertiseTagNameMap)}</td>
                        <td className="lecturer-actions">
                          <button type="button" onClick={() => openEditForm(lecturer)} title="Sửa">✎ <span>Sửa</span></button>
                          <button type="button" className="delete" onClick={() => void handleDelete(lecturer)} title="Xóa">× <span>Xóa</span></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="app-pagination" aria-label="Phân trang">
                <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>›</button>
              </nav>
            )}
          </section>

      {isFormOpen && (
        <div className="lecturer-modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <section className="lecturer-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lecturer-modal-header">
              <h3>{editingLecturer ? 'Cập nhật giảng viên' : 'Thêm giảng viên'}</h3>
              <button type="button" onClick={closeForm} aria-label="Đóng" title="Đóng">×</button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)}>
              {!editingLecturer && (
                <>
                  <label>Username</label>
                  <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nhập username" />

                  <label>Email</label>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Nhập email" />

                  <label>Mật khẩu</label>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" />
                </>
              )}

              <label>Mã giảng viên</label>
              <input value={lecturerCode} onChange={(event) => setLecturerCode(event.target.value)} placeholder="VD: GV001" />

              <label>ID khoa/phòng ban</label>
              <input value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} placeholder="VD: 1" />

              <label>Học hàm/học vị</label>
              <input value={academicTitle} onChange={(event) => setAcademicTitle(event.target.value)} placeholder="VD: ThS, TS" />

              <label>Số lượng phản biện tối đa</label>
              <input value={maxReviewLoad} onChange={(event) => setMaxReviewLoad(event.target.value)} placeholder="VD: 10" />

              <label>ID chuyên môn</label>
              <input value={expertiseTagIds} onChange={(event) => setExpertiseTagIds(event.target.value)} placeholder="VD: 1, 2, 3" />

              <div className="lecturer-modal-actions">
                <button type="button" className="secondary" onClick={closeForm}>Hủy</button>
                <button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      </>
    </DashboardLayout>
  )
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue ? Number(trimmedValue) : undefined
}

function parseNumberList(value: string) {
  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => Number.isFinite(item))

  return ids.length > 0 ? ids : undefined
}

function getExpertiseNames(
  ids: number[] | undefined,
  expertiseTagNameMap: Map<number, string>,
) {
  if (!ids || ids.length === 0) return '-'

  return ids
    .map((id) => expertiseTagNameMap.get(id) ?? `#${id}`)
    .join(', ')
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
