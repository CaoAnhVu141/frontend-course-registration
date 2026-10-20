import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Pencil, Trash2, X } from 'lucide-react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useConfirmation } from '../../confirmation'
import { useNotification } from '../../notification'
import { AppLoading, ExportButton, Pagination } from '../../ui'
import { getDepartments } from '../../departments/services/departmentApi'
import type { Department } from '../../departments/types/department.type'
import { createStudent, deleteStudent, getStudent, getStudents, updateStudent } from '../services/studentApi'
import type { Student } from '../types/student.type'
import './StudentsPage.css'

const PAGE_SIZE = 5
const emptyForm = { username: '', name: '', email: '', password: '', studentCode: '', departmentId: '', className: '' }

export function StudentsPage() {
  const user = tokenStorage.getUser()
  const canManage = hasRole(user?.roles, 'ADMIN')
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const dialogRef = useRef<HTMLElement>(null)
  const mutationPending = useRef(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError('')
    Promise.all([getStudents(), getDepartments()])
      .then(([studentData, departmentData]) => {
        if (cancelled) return
        setStudents(studentData)
        setDepartments(departmentData)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(error))
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [reload])

  useEffect(() => {
    if (!isFormOpen) return
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.querySelector<HTMLElement>('input')?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !mutationPending.current) {
        setIsFormOpen(false)
        setForm({ ...emptyForm })
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select'))
        .filter((element) => !element.matches(':disabled'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [isFormOpen])

  const departmentNames = useMemo(
    () => new Map(departments.map((department) => [department.departmentId, department.name])),
    [departments],
  )
  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    return students.filter((student) =>
      [student.username, student.name, student.email, student.studentCode, student.className, departmentNames.get(student.departmentId)]
        .some((value) => value?.toLocaleLowerCase('vi').includes(keyword)),
    )
  }, [students, search, departmentNames])
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function openForm(student: Student | null) {
    if (!canManage || mutationPending.current) return
    setEditingStudent(student)
    setForm(student ? {
      username: student.username,
      name: student.name ?? '',
      email: student.email,
      password: '',
      studentCode: student.studentCode,
      departmentId: String(student.departmentId ?? ''),
      className: student.className ?? '',
    } : { ...emptyForm })
    setIsFormOpen(true)
  }

  function closeForm() {
    if (mutationPending.current) return
    setIsFormOpen(false)
    setForm({ ...emptyForm })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage || mutationPending.current) return
    mutationPending.current = true
    setIsSaving(true)
    const payload = {
      name: form.name.trim(),
      studentCode: form.studentCode.trim(),
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      className: form.className.trim(),
    }
    try {
      const response = editingStudent
        ? await updateStudent(editingStudent.userId, payload)
        : await createStudent({ ...payload, username: form.username.trim(), email: form.email.trim(), password: form.password })
      setStudents((current) => editingStudent
        ? current.map((student) => student.userId === editingStudent.userId ? response.data : student)
        : [response.data, ...current])
      if (!editingStudent) { setSearch(''); setPage(1) }
      success(response.message)
      setIsFormOpen(false)
      setForm({ ...emptyForm })
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      mutationPending.current = false
      setIsSaving(false)
    }
  }

  async function handleDelete(student: Student) {
    if (!canManage || mutationPending.current) return
    mutationPending.current = true
    setDeletingId(student.userId)
    try {
      const accepted = await confirm({
        title: 'Xóa sinh viên',
        message: `Bạn có chắc muốn xóa sinh viên "${student.email}" không?`,
        confirmText: 'Xóa', cancelText: 'Hủy', tone: 'danger',
      })
      if (!accepted) return
      const response = await deleteStudent(student.userId)
      setStudents((current) => current.filter((item) => item.userId !== student.userId))
      success(response.message)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      mutationPending.current = false
      setDeletingId(null)
    }
  }

  async function openDetail(student: Student) {
    try {
      setIsDetailLoading(true)
      setDetailStudent(student)
      const response = await getStudent(student.userId)
      setDetailStudent(response.data)
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailStudent(null)
  }

  return (
    <DashboardLayout title="QUẢN LÝ SINH VIÊN" contentClassName="students-content">
      <section className="students-panel">
        <div className="students-toolbar">
          <input className="student-search" type="search" aria-label="Tìm kiếm sinh viên" placeholder="Tìm mã sinh viên, email, lớp, khoa..." value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
          <ExportButton
            fileName="danh-sach-sinh-vien"
            rows={[
              ['ID', 'Mã sinh viên', 'Họ và tên', 'Email', 'Lớp', 'Khoa / phòng ban'],
              ...filteredStudents.map((student) => [
                student.userId,
                student.studentCode,
                student.name || '-',
                student.email,
                student.className || '-',
                departmentNames.get(student.departmentId) ?? `#${student.departmentId}`,
              ]),
            ]}
            disabled={isLoading || Boolean(loadError) || filteredStudents.length === 0}
          />
          <button
            className="student-primary"
            disabled={!canManage || isLoading || Boolean(loadError) || deletingId !== null}
            title={canManage ? 'Thêm sinh viên' : 'Bạn không có quyền thêm sinh viên'}
            onClick={() => openForm(null)}
          >
            + Thêm mới
          </button>
        </div>
        {loadError && <div className="student-error" role="alert">{loadError} <button onClick={() => setReload((value) => value + 1)}>Thử lại</button></div>}
        <div className="student-table-wrap">
          <table className="student-table">
            <thead><tr><th>ID</th><th>Mã sinh viên</th><th>Họ và tên</th><th>Email</th><th>Lớp</th><th>Khoa/Phòng ban</th><th>Thao tác</th></tr></thead>
            <tbody>
              {isLoading || loadError || visibleStudents.length === 0 ? (
                <tr><td colSpan={7} className="student-empty">{isLoading ? <AppLoading /> : loadError ? 'Không thể tải danh sách sinh viên.' : 'Không tìm thấy sinh viên.'}</td></tr>
              ) : visibleStudents.map((student) => (
                <tr key={student.userId}>
                  <td>{student.userId}</td><td>{student.studentCode}</td><td>{student.name || '-'}</td><td>{student.email}</td><td>{student.className || '-'}</td>
                  <td>{departmentNames.get(student.departmentId) ?? `#${student.departmentId}`}</td>
                  <td><div className="student-actions">
                    <button
                      title="Chi tiết sinh viên"
                      onClick={() => void openDetail(student)}
                    >
                      <Eye aria-hidden="true" size={16} strokeWidth={1.9} /><span>Chi tiết</span>
                    </button>
                    <button
                      title={canManage ? 'Sửa sinh viên' : 'Bạn không có quyền sửa sinh viên'}
                      disabled={!canManage || deletingId !== null}
                      onClick={() => openForm(student)}
                    >
                      <Pencil aria-hidden="true" size={16} strokeWidth={1.9} /><span>Sửa</span>
                    </button>
                    <button
                      className="student-delete"
                      title={canManage ? 'Xóa sinh viên' : 'Bạn không có quyền xóa sinh viên'}
                      disabled={!canManage || deletingId !== null}
                      onClick={() => void handleDelete(student)}
                    >
                      <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} /><span>{deletingId === student.userId ? 'Đang xử lý...' : 'Xóa'}</span>
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && !loadError && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Phân trang sinh viên"
          />
        )}
      </section>
      {detailStudent && <div className="student-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetail() }}>
      <section role="dialog" aria-modal="true" className="student-modal student-detail-modal" aria-labelledby="student-detail-title">
        <div className="student-modal-header">
          <h3 id="student-detail-title">Chi tiết sinh viên</h3>
          <button type="button" title="Đóng" aria-label="Đóng" disabled={isDetailLoading} onClick={closeDetail}><X aria-hidden="true" size={20} strokeWidth={2} /></button>
        </div>
        <div className="student-detail">
          {isDetailLoading ? (
            <AppLoading />
          ) : (
            <dl className="student-detail-grid">
              <dt>User ID</dt>
              <dd>{detailStudent.userId}</dd>
              <dt>Tên đăng nhập</dt>
              <dd>{detailStudent.username}</dd>
              <dt>Họ và tên</dt>
              <dd>{detailStudent.name || '-'}</dd>
              <dt>Email</dt>
              <dd>{detailStudent.email}</dd>
              <dt>Mã sinh viên</dt>
              <dd>{detailStudent.studentCode}</dd>
              <dt>Lớp</dt>
              <dd>{detailStudent.className || '-'}</dd>
              <dt>Khoa/Phòng ban</dt>
              <dd>{departmentNames.get(detailStudent.departmentId) ?? `#${detailStudent.departmentId}`}</dd>
            </dl>
          )}
        </div>
      </section>
      </div>}
      {canManage && isFormOpen && <div className="student-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm() }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" className="student-modal" aria-labelledby="student-form-title">
        <div className="student-modal-header">
          <h3 id="student-form-title">{editingStudent ? 'Cập nhật sinh viên' : 'Thêm sinh viên'}</h3>
          <button type="button" title="Đóng" aria-label="Đóng" disabled={isSaving} onClick={closeForm}><X aria-hidden="true" size={20} strokeWidth={2} /></button>
        </div>
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <fieldset disabled={isSaving}>
            {!editingStudent && <>
              <label htmlFor="student-username">Tên đăng nhập</label>
              <input id="student-username" autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              <label htmlFor="student-name">Họ và tên</label>
              <input id="student-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <label htmlFor="student-email">Email</label>
              <input id="student-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <label htmlFor="student-password">Mật khẩu</label>
              <input id="student-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </>}
            {editingStudent && <>
              <label htmlFor="student-name">Họ và tên</label>
              <input id="student-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </>}
            <label htmlFor="student-code">Mã sinh viên</label>
            <input id="student-code" value={form.studentCode} onChange={(event) => setForm({ ...form, studentCode: event.target.value })} />
            <label htmlFor="student-department">Khoa/Phòng ban</label>
            <select id="student-department" value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
              <option value="">Chọn khoa/phòng ban</option>
              {form.departmentId && !departmentNames.has(Number(form.departmentId)) && <option value={form.departmentId}>#{form.departmentId}</option>}
              {departments.map((department) => <option key={department.departmentId} value={department.departmentId}>{department.name}</option>)}
            </select>
            <label htmlFor="student-class">Lớp</label>
            <input id="student-class" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} />
            <div className="student-modal-actions">
              <button type="button" onClick={closeForm}>Hủy</button>
              <button className="student-primary" type="submit">{isSaving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </fieldset>
        </form>
      </section>
      </div>}
    </DashboardLayout>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}