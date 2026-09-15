import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { AppLoading, Pagination } from '../../ui'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../services/departmentApi'
import type { Department } from '../types/department.type'
import './DepartmentsPage.css'
import { useNotification } from '../../notification'
import { useConfirmation } from '../../confirmation'

const PAGE_SIZE = 5

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [departmentName, setDepartmentName] = useState('')

  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const matchingDepartments = !keyword
      ? departments
      : departments.filter((department) =>
          department.name.toLocaleLowerCase('vi').includes(keyword),
        )

    return [...matchingDepartments].sort(
      (firstDepartment, secondDepartment) =>
        secondDepartment.departmentId - firstDepartment.departmentId,
    )
  }, [departments, search])

  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE))
  const visibleDepartments = filteredDepartments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const {
    success,
    error: showError,
  } = useNotification()
  const { confirm } = useConfirmation()

  useEffect(() => {
    void loadDepartments()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  async function loadDepartments() {
    setIsLoading(true)
    setError('')
    try {
      setDepartments(await getDepartments())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingDepartment(null)
    setDepartmentName('')
    setError('')
    setIsFormOpen(true)
  }

  function openEditForm(department: Department) {
    setEditingDepartment(department)
    setDepartmentName(department.name)
    setError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
  }

  async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault()

  const name = departmentName.trim()

  setIsSaving(true)

  try {
    if (editingDepartment) {
      const response = await updateDepartment(
        editingDepartment.departmentId,
        { name },
      )

      setDepartments((current) =>
        current.map((item) =>
          item.departmentId === response.data.departmentId
            ? response.data
            : item,
        ),
      )

      success(response.message)
    } else {
      const response = await createDepartment({ name })

      setDepartments((current) => [
        ...current,
        response.data,
      ])

      success(response.message)
    }

    setIsFormOpen(false)
  } catch (requestError) {
    showError(getErrorMessage(requestError))
  } finally {
    setIsSaving(false)
  }
}

  async function handleDelete(department: Department) {
    const shouldDelete = await confirm({
      title: 'Xóa khoa / phòng ban',
      message: `Bạn có chắc muốn xóa "${department.name}" không? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      tone: 'danger',
    })
    if (!shouldDelete) return

    try {
      const response = await deleteDepartment(department.departmentId)
      setDepartments((current) =>
        current.filter((item) => item.departmentId !== department.departmentId),
      )
      success(response.message)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    }
  }

  return (
    <DashboardLayout title="QUẢN LÝ KHOA / PHÒNG BAN" contentClassName="departments-content">
      <>
          <section className="departments-panel">
            <div className="departments-toolbar">
              <label className="department-search">
                <span>⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm khoa/phòng ban..."
                />
              </label>
              <button className="department-add-button" type="button" onClick={openCreateForm}>
                <span>+</span> Thêm mới
              </button>
            </div>

            {error && <div className="department-message error">{error}</div>}

            <div className="department-table-wrap">
              <table className="department-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên khoa / phòng ban</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={3} className="department-empty"><AppLoading /></td></tr>
                  ) : visibleDepartments.length === 0 ? (
                    <tr><td colSpan={3} className="department-empty">Không tìm thấy khoa/phòng ban.</td></tr>
                  ) : (
                    visibleDepartments.map((department) => (
                      <tr key={department.departmentId}>
                        <td>{department.departmentId}</td>
                        <td>{department.name}</td>
                        <td className="department-actions">
                          <button type="button" onClick={() => openEditForm(department)} title="Sửa">✎ <span>Sửa</span></button>
                          <button type="button" className="delete" onClick={() => void handleDelete(department)} title="Xóa">× <span>Xóa</span></button>
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
        <div className="department-modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <section className="department-modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="department-modal-header">
              <h3 id="department-form-title">{editingDepartment ? 'Cập nhật khoa / phòng ban' : 'Thêm khoa / phòng ban'}</h3>
              <button type="button" onClick={closeForm} aria-label="Đóng" title="Đóng">×</button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label htmlFor="department-name">Tên khoa / phòng ban</label>
              <input
                id="department-name"
                autoFocus
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                placeholder="Nhập tên khoa/phòng ban"
                maxLength={255}
              />
              <div className="department-modal-actions">
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
