import { useEffect, useMemo, useState } from 'react'
import { useConfirmation } from '../../confirmation'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import {
        createExpertiseTag,
        deleteExpertiseTag,
        getExpertiseTags,
        updateExpertiseTag,
      }
       from '../services/expertiseTagApi'
import type { ExpertiseTag } from '../types/expertiseTag.type'
import './ExpertiseTagsPage.css'

const PAGE_SIZE = 5

export function ExpertiseTagsPage() {
  const { success, error: showError } = useNotification()
  const { confirm } = useConfirmation()
  const [expertiseTags, setExpertiseTags] = useState<ExpertiseTag[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<ExpertiseTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagStatus, setTagStatus] = useState(true)

  const filteredTags = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const matchingTags = keyword
      ? expertiseTags.filter((tag) => tag.name.toLocaleLowerCase('vi').includes(keyword))
      : expertiseTags

    return [...matchingTags].sort((firstTag, secondTag) => secondTag.id - firstTag.id)
  }, [expertiseTags, search])
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE))
  const visibleTags = filteredTags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { void loadExpertiseTags() }, [])
  useEffect(() => { setPage(1) }, [search])

  async function loadExpertiseTags() {
    setIsLoading(true)
    setError('')
    try {
      setExpertiseTags(await getExpertiseTags())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingTag(null)
    setTagName('')
    setTagStatus(true)
    setIsFormOpen(true)
  }

  function openEditForm(tag: ExpertiseTag) {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagStatus(tag.status)
    setIsFormOpen(true)
  }

  function closeForm() { if (!isSaving) setIsFormOpen(false) }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    try {
      const payload = { name: tagName.trim(), status: tagStatus }
      const response = editingTag
        ? await updateExpertiseTag(editingTag.id, payload)
        : await createExpertiseTag(payload)
      setExpertiseTags((current) => editingTag
        ? current.map((tag) => tag.id === response.data.id ? response.data : tag)
        : [...current, response.data])
      success(response.message)
      setIsFormOpen(false)
    } catch (requestError) {
      showError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(tag: ExpertiseTag) {
    const shouldDelete = await confirm({
      title: 'Xóa chuyên môn',
      message: `Bạn có chắc muốn xóa "${tag.name}" không? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa', cancelText: 'Hủy', tone: 'danger',
    })
    if (!shouldDelete) return
    try {
      const response = await deleteExpertiseTag(tag.id)
      setExpertiseTags((current) => current.filter((item) => item.id !== tag.id))
      success(response.message)
    } catch (requestError) { showError(getErrorMessage(requestError)) }
  }

  return (
    <DashboardLayout title="QUẢN LÝ CHUYÊN MÔN" contentClassName="expertise-tags-content">
      <section className="expertise-tags-panel">
        <div className="expertise-tags-toolbar">
          <label className="expertise-tag-search"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm chuyên môn..." /></label>
          <button className="expertise-tag-add-button" type="button" onClick={openCreateForm}><span>+</span> Thêm mới</button>
        </div>
        {error && <div className="expertise-tag-message error">{error}</div>}
        <div className="expertise-tag-table-wrap"><table className="expertise-tag-table">
          <thead><tr><th>STT</th><th>Tên chuyên môn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>{isLoading ? <tr><td colSpan={4} className="expertise-tag-empty">Đang tải dữ liệu...</td></tr> : visibleTags.length === 0 ? <tr><td colSpan={4} className="expertise-tag-empty">Không tìm thấy chuyên môn.</td></tr> : visibleTags.map((tag) => <tr key={tag.id}><td>{tag.id}</td><td>{tag.name}</td><td><span className={`expertise-tag-status ${tag.status ? 'active' : 'inactive'}`}>{tag.status ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></td><td className="expertise-tag-actions"><button type="button" onClick={() => openEditForm(tag)}>✎ <span>Sửa</span></button><button type="button" className="delete" onClick={() => void handleDelete(tag)}>× <span>Xóa</span></button></td></tr>)}</tbody>
        </table></div>
        {totalPages > 1 && <nav className="expertise-tag-pagination" aria-label="Phân trang"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={pageNumber === page ? 'active' : ''} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}<button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>›</button></nav>}
      </section>
      {isFormOpen && <div className="expertise-tag-modal-backdrop" role="presentation" onMouseDown={closeForm}><section className="expertise-tag-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="expertise-tag-modal-header"><h3>{editingTag ? 'Cập nhật chuyên môn' : 'Thêm chuyên môn'}</h3><button type="button" onClick={closeForm} aria-label="Đóng">×</button></div><form onSubmit={(event) => void handleSubmit(event)}><label htmlFor="expertise-tag-name">Tên chuyên môn</label><input id="expertise-tag-name" autoFocus required value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Nhập tên chuyên môn" maxLength={255} /><label className="expertise-tag-status-input"><input type="checkbox" checked={tagStatus} onChange={(event) => setTagStatus(event.target.checked)} /> Đang hoạt động</label><div className="expertise-tag-modal-actions"><button type="button" className="secondary" onClick={closeForm}>Hủy</button><button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu'}</button></div></form></section></div>}
    </DashboardLayout>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
