import { useEffect, useMemo, useState } from 'react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { getRoleLabel } from '../../../shared/utils/roleLabel'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../services/departmentApi'
import type { Department } from '../types/department.type'
import '../../dashboard/pages/DashboardPage.css'
import './DepartmentsPage.css'
import { useNotification } from '../../notification'

const PAGE_SIZE = 5

const navItems = [
  { label: 'Chương trình đào tạo', icon: '▤', href: '#!' },
  { label: 'Quản lý khoa/phòng ban', icon: '▦', href: '/departments' },
  { label: 'Quản lý chuyên môn', icon: '▣', href: '#!' },
  { label: 'Quản lý giảng viên', icon: '▥', href: '#!' },
  { label: 'Quản lý kỳ đăng ký', icon: '◴', href: '#!' },
  { label: 'Quản lý nhóm sinh viên', icon: '★', href: '#!' },
  { label: 'Quản lý sinh viên', icon: '●', href: '#!' },
  { label: 'Quản lý đề tài', icon: '▧', href: '#!' },
  { label: 'Quản lý đăng ký đề tài', icon: '▨', href: '#!' },
]

export function DepartmentsPage() {
  const user = tokenStorage.getUser()
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
    if (!keyword) return departments

    return departments.filter((department) =>
      department.name.toLocaleLowerCase('vi').includes(keyword),
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
    const shouldDelete = window.confirm(
      `Bạn có chắc muốn xóa "${department.name}" không?`,
    )
    if (!shouldDelete) return

    setError('')
    try {
      await deleteDepartment(department.departmentId)
      setDepartments((current) =>
        current.filter((item) => item.departmentId !== department.departmentId),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function handleLogout() {
    tokenStorage.clear()
    window.location.href = '/'
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="logo-section">
          <img src="https://tracuuxettuyen.hcmute.edu.vn/assets/img/logo/ute_logo.png" alt="HCM-UTE" />
          <h3>HCM-UTE</h3>
        </div>
        <div className="user-info">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="Avatar" className="avatar" />
          <h4>{user.email ?? 'Chưa có email'}</h4>
          <p>{getRoleLabel(user.roles)}</p>
        </div>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.label}>
              <a className={item.href === '/departments' ? 'active' : ''} href={item.href}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM</h2>
          <div className="top-actions">
            <span className="flag-icon">⚑</span>
            <span className="bell-icon">●</span>
            <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="User" />
            <button type="button" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">↪</button>
          </div>
        </header>

        <div className="content-body departments-content">
          <div className="page-title">QUẢN LÝ KHOA / PHÒNG BAN</div>

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
                    <th>ID</th>
                    <th>Tên khoa / phòng ban</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={3} className="department-empty">Đang tải dữ liệu...</td></tr>
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

            {totalPages > 1 && (
              <nav className="department-pagination" aria-label="Phân trang">
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
        </div>
      </main>

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
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
