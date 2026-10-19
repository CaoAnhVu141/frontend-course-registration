import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Search, Trash2, X } from 'lucide-react'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading, ExportButton, Pagination } from '../../ui'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { getDepartments } from '../../departments/services/departmentApi'
import type { Department } from '../../departments/types/department.type'
import {
  createLecturer,
  deleteLecturer,
  getLecturer,
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
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null)
  const [detailLecturer, setDetailLecturer] = useState<Lecturer | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lecturerCode, setLecturerCode] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [academicTitle, setAcademicTitle] = useState('')
  const [maxReviewLoad, setMaxReviewLoad] = useState('')
  const [expertiseTagIds, setExpertiseTagIds] = useState<number[]>([])

  function toggleExpertiseTag(id: number) {
    setExpertiseTagIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

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
  const departmentNameMap = useMemo(() => {
    return new Map(
      departments.map((department) => [
        department.departmentId,
        department.name,
      ]),
    )
  }, [departments])

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
      const [lecturerData, expertiseTagData, departmentData] = await Promise.all([
        getLecturers(),
        getExpertiseTags(),
        getDepartments(),
      ])

      setLecturers(lecturerData)
      setExpertiseTags(expertiseTagData)
      setDepartments(departmentData)
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
    setExpertiseTagIds([])
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
    setExpertiseTagIds(lecturer.expertiseTagIds ?? [])
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
      expertiseTagIds: expertiseTagIds.length > 0 ? expertiseTagIds : undefined,
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

  async function openDetail(lecturer: Lecturer) {
    try {
      setIsDetailLoading(true)
      setDetailLecturer(lecturer)
      const response = await getLecturer(lecturer.userId)
      setDetailLecturer(response.data)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailLecturer(null)
  }

  return (
    <DashboardLayout title="QUẢN LÝ GIẢNG VIÊN" contentClassName="lecturers-content">
      <>
          <section className="lecturers-panel">
            <div className="lecturers-toolbar">
              <label className="lecturer-search">
                <Search aria-hidden="true" size={17} strokeWidth={2} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm giảng viên..."
                />
              </label>

              <ExportButton
                fileName="danh-sach-giang-vien"
                rows={[
                  ['ID', 'Mã GV', 'Email', 'Khoa / phòng ban', 'Học hàm / học vị', 'Tải phản biện', 'Chuyên môn'],
                  ...filteredLecturers.map((lecturer) => [
                    lecturer.userId,
                    lecturer.lecturerCode,
                    lecturer.email,
                    departmentNameMap.get(lecturer.departmentId) ?? `#${lecturer.departmentId}`,
                    lecturer.academicTitle || '-',
                    lecturer.maxReviewLoad,
                    getExpertiseNames(lecturer.expertiseTagIds, expertiseTagNameMap),
                  ]),
                ]}
                disabled={isLoading || filteredLecturers.length === 0}
              />

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
                    <tr><td colSpan={8} className="lecturer-empty"><AppLoading /></td></tr>
                  ) : visibleLecturers.length === 0 ? (
                    <tr><td colSpan={8} className="lecturer-empty">Không tìm thấy giảng viên.</td></tr>
                  ) : (
                    visibleLecturers.map((lecturer) => (
                      <tr key={lecturer.userId}>
                        <td>{lecturer.userId}</td>
                        <td>{lecturer.lecturerCode}</td>
                        <td>{lecturer.email}</td>
                        <td>{departmentNameMap.get(lecturer.departmentId) ?? `#${lecturer.departmentId}`}</td>
                        <td>{lecturer.academicTitle || '-'}</td>
                        <td>{lecturer.maxReviewLoad}</td>
                        <td>{getExpertiseNames(lecturer.expertiseTagIds, expertiseTagNameMap)}</td>
                        <td className="lecturer-actions">
                          <button type="button" onClick={() => void openDetail(lecturer)} title="Chi tiết"><Eye aria-hidden="true" size={16} strokeWidth={1.9} /><span>Chi tiết</span></button>
                          <button type="button" onClick={() => openEditForm(lecturer)} title="Sửa"><Pencil aria-hidden="true" size={16} strokeWidth={1.9} /><span>Sửa</span></button>
                          <button type="button" className="delete" onClick={() => void handleDelete(lecturer)} title="Xóa"><Trash2 aria-hidden="true" size={16} strokeWidth={1.9} /><span>Xóa</span></button>
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
        <div className="lecturer-modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <section className="lecturer-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lecturer-modal-header">
              <h3>{editingLecturer ? 'Cập nhật giảng viên' : 'Thêm giảng viên'}</h3>
              <button type="button" onClick={closeForm} aria-label="Đóng" title="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
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

              <label>Khoa/phòng ban</label>
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">-- Chọn khoa/phòng ban --</option>
                {departments.map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.name}
                  </option>
                ))}
              </select>

              <label>Học hàm/học vị</label>
              <input value={academicTitle} onChange={(event) => setAcademicTitle(event.target.value)} placeholder="VD: ThS, TS" />

              <label>Số lượng phản biện tối đa</label>
              <input value={maxReviewLoad} onChange={(event) => setMaxReviewLoad(event.target.value)} placeholder="VD: 10" />

              <label>Chuyên môn</label>
              {expertiseTags.length === 0 ? (
                <p className="lecturer-field-empty">Chưa có chuyên môn nào.</p>
              ) : (
                <div className="lecturer-expertise-list">
                  {expertiseTags.map((tag) => (
                    <label key={tag.id} className="lecturer-expertise-option">
                      <input
                        type="checkbox"
                        checked={expertiseTagIds.includes(tag.id)}
                        onChange={() => toggleExpertiseTag(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="lecturer-modal-actions">
                <button type="button" className="secondary" onClick={closeForm}>Hủy</button>
                <button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detailLecturer && (
        <div className="lecturer-modal-backdrop" role="presentation" onMouseDown={closeDetail}>
          <section className="lecturer-modal lecturer-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lecturer-modal-header">
              <h3>Chi tiết giảng viên</h3>
              <button type="button" onClick={closeDetail} aria-label="Đóng" title="Đóng"><X aria-hidden="true" size={20} strokeWidth={2} /></button>
            </div>
            <div className="lecturer-detail">
              {isDetailLoading ? (
                <AppLoading />
              ) : (
                <dl className="lecturer-detail-grid">
                  <dt>User ID</dt>
                  <dd>{detailLecturer.userId}</dd>
                  <dt>Tên đăng nhập</dt>
                  <dd>{detailLecturer.username}</dd>
                  <dt>Email</dt>
                  <dd>{detailLecturer.email}</dd>
                  <dt>Mã giảng viên</dt>
                  <dd>{detailLecturer.lecturerCode}</dd>
                  <dt>Khoa/Phòng ban</dt>
                  <dd>{departmentNameMap.get(detailLecturer.departmentId) ?? `#${detailLecturer.departmentId}`}</dd>
                  <dt>Học hàm/học vị</dt>
                  <dd>{detailLecturer.academicTitle || '-'}</dd>
                  <dt>Tải phản biện tối đa</dt>
                  <dd>{detailLecturer.maxReviewLoad}</dd>
                  <dt>Chuyên môn</dt>
                  <dd>{getExpertiseNames(detailLecturer.expertiseTagIds, expertiseTagNameMap)}</dd>
                </dl>
              )}
            </div>
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
