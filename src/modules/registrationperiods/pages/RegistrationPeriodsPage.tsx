import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading, Pagination } from '../../ui'
import {
  createRegistrationPeriod,
  deleteRegistrationPeriod,
  getRegistrationPeriods,
  updateRegistrationPeriod,
} from '../services/registrationPeriodApi'
import type {
  RegistrationPeriod,
  RegistrationPeriodRequest,
} from '../types/registrationPeriod.type'
import './RegistrationPeriodsPage.css'

const PAGE_SIZE = 5

const emptyForm = {
  name: '',
  type: '',
  lecturerRegistrationStart: '',
  lecturerRegistrationEnd: '',
  studentRegistrationStart: '',
  studentRegistrationEnd: '',
  reviewerScoreDeadline: '',
  defenseDate: '',
  status: true,
}

type RegistrationPeriodForm = typeof emptyForm

export function RegistrationPeriodsPage() {
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingPeriod, setEditingPeriod] = useState<RegistrationPeriod | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<RegistrationPeriodForm>(emptyForm)

  const filteredPeriods = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedPeriods = [...periods].sort((first, second) => second.id - first.id)

    if (!keyword) return sortedPeriods

    return sortedPeriods.filter((period) =>
      [
        period.id,
        period.name,
        period.type,
        period.status ? 'Đang hoạt động' : 'Không còn hoạt động',
        formatDateTime(period.lecturerRegistrationStart),
        formatDateTime(period.lecturerRegistrationEnd),
        formatDateTime(period.studentRegistrationStart),
        formatDateTime(period.studentRegistrationEnd),
        formatDateTime(period.reviewerScoreDeadline),
        formatDateTime(period.defenseDate),
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      ),
    )
  }, [periods, search])

  const totalPages = Math.max(1, Math.ceil(filteredPeriods.length / PAGE_SIZE))
  const visiblePeriods = filteredPeriods.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  useEffect(() => {
    if (!user) {
      window.location.href = '/'
      return
    }

    if (!isAdmin) {
      window.location.href = '/dashboard'
      return
    }

    void loadPeriods()
  }, [isAdmin, user])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function loadPeriods() {
    setIsLoading(true)
    setError('')

    try {
      setPeriods(await getRegistrationPeriods())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingPeriod(null)
    setForm(emptyForm)
    setError('')
    setIsFormOpen(true)
  }

  function openEditForm(period: RegistrationPeriod) {
    setEditingPeriod(period)
    setForm({
      name: period.name,
      type: period.type,
      lecturerRegistrationStart: toInputDateTime(period.lecturerRegistrationStart),
      lecturerRegistrationEnd: toInputDateTime(period.lecturerRegistrationEnd),
      studentRegistrationStart: toInputDateTime(period.studentRegistrationStart),
      studentRegistrationEnd: toInputDateTime(period.studentRegistrationEnd),
      reviewerScoreDeadline: toInputDateTime(period.reviewerScoreDeadline),
      defenseDate: toInputDateTime(period.defenseDate),
      status: period.status,
    })
    setError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    const payload = toRequestPayload(form)

    try {
      if (editingPeriod) {
        const response = await updateRegistrationPeriod(editingPeriod.id, payload)

        setPeriods((current) =>
          current.map((period) =>
            period.id === response.data.id ? response.data : period,
          ),
        )
        success(response.message)
      } else {
        const response = await createRegistrationPeriod(payload)
        setPeriods((current) => [response.data, ...current])
        success(response.message)
      }

      setIsFormOpen(false)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(period: RegistrationPeriod) {
    const shouldDelete = await confirm({
      title: 'Xóa kỳ đăng ký',
      message: `Bạn có chắc muốn xóa kỳ đăng ký "${period.name}" không?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      tone: 'danger',
    })

    if (!shouldDelete) return

    try {
      const response = await deleteRegistrationPeriod(period.id)
      setPeriods((current) => current.filter((item) => item.id !== period.id))
      success(response.message)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    }
  }

  if (!user || !isAdmin) return null

  return (
    <DashboardLayout title="QUẢN LÝ KỲ ĐĂNG KÝ" contentClassName="registration-periods-content">
      <section className="registration-periods-panel">
        <div className="registration-periods-toolbar">
          <label className="registration-period-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm kỳ đăng ký..."
            />
          </label>
          <button className="registration-period-add-button" type="button" onClick={openCreateForm}>
            <span>+</span> Thêm mới
          </button>
        </div>

        {error && <div className="registration-period-message error">{error}</div>}

        <div className="registration-period-table-wrap">
          <table className="registration-period-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên kỳ</th>
                <th>Loại</th>
                <th>GV đăng ký</th>
                <th>SV đăng ký</th>
                <th>Deadline phản biện</th>
                <th>Ngày bảo vệ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="registration-period-empty">
                    <AppLoading />
                  </td>
                </tr>
              ) : visiblePeriods.length === 0 ? (
                <tr>
                  <td colSpan={9} className="registration-period-empty">
                    Không tìm thấy kỳ đăng ký.
                  </td>
                </tr>
              ) : (
                visiblePeriods.map((period) => (
                  <tr key={period.id}>
                    <td>{period.id}</td>
                    <td>{period.name}</td>
                    <td>{period.type}</td>
                    <td>{formatDateRange(period.lecturerRegistrationStart, period.lecturerRegistrationEnd)}</td>
                    <td>{formatDateRange(period.studentRegistrationStart, period.studentRegistrationEnd)}</td>
                    <td>{formatDateTime(period.reviewerScoreDeadline)}</td>
                    <td>{formatDateTime(period.defenseDate)}</td>
                    <td>
                      <span className={`registration-period-status ${period.status ? 'active' : 'inactive'}`}>
                        {period.status ? 'Đang hoạt động' : 'Không còn hoạt động'}
                      </span>
                    </td>
                    <td className="registration-period-actions">
                      <button type="button" onClick={() => openEditForm(period)}>
                        ✎ <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        className="delete"
                        onClick={() => void handleDelete(period)}
                      >
                        × <span>Xóa</span>
                      </button>
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
        <div className="registration-period-modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <section className="registration-period-modal" role="dialog" aria-modal="true" aria-labelledby="registration-period-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="registration-period-modal-header">
              <h3 id="registration-period-form-title">
                {editingPeriod ? 'Cập nhật kỳ đăng ký' : 'Thêm kỳ đăng ký'}
              </h3>
              <button type="button" onClick={closeForm} aria-label="Đóng" title="Đóng">
                ×
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="registration-period-name">Tên kỳ</label>
                <input
                  className="form-control"
                  id="registration-period-name"
                  autoFocus
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="VD: HK1 2026-2027"
                  maxLength={255}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="registration-period-type">Loại kỳ</label>
                <input
                  className="form-control"
                  id="registration-period-type"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  placeholder="VD: KHOA_LUAN"
                  maxLength={100}
                />
              </div>

              <div className="registration-period-form-grid">
                <DateTimeField
                  id="lecturer-registration-start"
                  label="GV đăng ký bắt đầu"
                  value={form.lecturerRegistrationStart}
                  onChange={(value) => setForm({ ...form, lecturerRegistrationStart: value })}
                />
                <DateTimeField
                  id="lecturer-registration-end"
                  label="GV đăng ký kết thúc"
                  value={form.lecturerRegistrationEnd}
                  onChange={(value) => setForm({ ...form, lecturerRegistrationEnd: value })}
                />
                <DateTimeField
                  id="student-registration-start"
                  label="SV đăng ký bắt đầu"
                  value={form.studentRegistrationStart}
                  onChange={(value) => setForm({ ...form, studentRegistrationStart: value })}
                />
                <DateTimeField
                  id="student-registration-end"
                  label="SV đăng ký kết thúc"
                  value={form.studentRegistrationEnd}
                  onChange={(value) => setForm({ ...form, studentRegistrationEnd: value })}
                />
                <DateTimeField
                  id="reviewer-score-deadline"
                  label="Deadline phản biện"
                  value={form.reviewerScoreDeadline}
                  onChange={(value) => setForm({ ...form, reviewerScoreDeadline: value })}
                />
                <DateTimeField
                  id="defense-date"
                  label="Ngày bảo vệ"
                  value={form.defenseDate}
                  onChange={(value) => setForm({ ...form, defenseDate: value })}
                />
              </div>

              {editingPeriod && (
                <div className="form-field">
                  <label className="form-label" htmlFor="registration-period-status">Trạng thái</label>
                  <select
                    className="form-control"
                    id="registration-period-status"
                    value={String(form.status)}
                    onChange={(event) => setForm({ ...form, status: event.target.value === 'true' })}
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Không còn hoạt động</option>
                  </select>
                </div>
              )}

              <div className="registration-period-modal-actions">
                <button type="button" className="secondary" onClick={closeForm}>
                  Hủy
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

type DateTimeFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function DateTimeField({ id, label, value, onChange }: DateTimeFieldProps) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        className="form-control"
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function toRequestPayload(form: RegistrationPeriodForm): RegistrationPeriodRequest {
  return {
    name: form.name.trim(),
    type: form.type.trim(),
    lecturerRegistrationStart: toApiDateTime(form.lecturerRegistrationStart),
    lecturerRegistrationEnd: toApiDateTime(form.lecturerRegistrationEnd),
    studentRegistrationStart: toApiDateTime(form.studentRegistrationStart),
    studentRegistrationEnd: toApiDateTime(form.studentRegistrationEnd),
    reviewerScoreDeadline: toApiDateTime(form.reviewerScoreDeadline),
    defenseDate: toApiDateTime(form.defenseDate),
    status: form.status,
  }
}

function toInputDateTime(value: string) {
  return value ? value.slice(0, 16) : ''
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function formatDateRange(start: string, end: string) {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`
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
