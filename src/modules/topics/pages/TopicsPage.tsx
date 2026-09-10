import { useMemo, useState } from 'react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import './TopicsPage.css'

type Topic = {
  id: number
  code: string
  title: string
  lecturer: string
  status: 'Đang mở' | 'Đã đóng'
}

const initialTopics: Topic[] = [
  { id: 1, code: 'DT001', title: 'Xây dựng hệ thống đăng ký học phần trực tuyến', lecturer: 'TS. Nguyễn Văn An', status: 'Đang mở' },
  { id: 2, code: 'DT002', title: 'Ứng dụng AI trong quản lý đào tạo', lecturer: 'ThS. Trần Minh Khang', status: 'Đang mở' },
  { id: 3, code: 'DT003', title: 'Nghiên cứu giải pháp bảo mật dữ liệu sinh viên', lecturer: 'TS. Lê Hoài Nam', status: 'Đã đóng' },
]

export function TopicsPage() {
  const [topics, setTopics] = useState(initialTopics)
  const [search, setSearch] = useState('')
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [lecturer, setLecturer] = useState('')
  const [status, setStatus] = useState<Topic['status']>('Đang mở')

  const visibleTopics = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    if (!keyword) return topics
    return topics.filter((topic) =>
      [topic.code, topic.title, topic.lecturer].some((value) =>
        value.toLocaleLowerCase('vi').includes(keyword),
      ),
    )
  }, [search, topics])

  function openCreateForm() {
    setEditingTopic(null)
    setCode(`DT${String(topics.length + 1).padStart(3, '0')}`)
    setTitle('')
    setLecturer('')
    setStatus('Đang mở')
    setIsFormOpen(true)
  }

  function openEditForm(topic: Topic) {
    setEditingTopic(topic)
    setCode(topic.code)
    setTitle(topic.title)
    setLecturer(topic.lecturer)
    setStatus(topic.status)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const topicData = { code: code.trim(), title: title.trim(), lecturer: lecturer.trim(), status }

    if (!topicData.code || !topicData.title || !topicData.lecturer) return

    if (editingTopic) {
      setTopics((current) => current.map((topic) =>
        topic.id === editingTopic.id ? { ...topic, ...topicData } : topic,
      ))
    } else {
      setTopics((current) => [...current, { id: Date.now(), ...topicData }])
    }
    closeForm()
  }

  function deleteTopic(topicId: number) {
    setTopics((current) => current.filter((topic) => topic.id !== topicId))
  }

  return (
    <DashboardLayout title="QUẢN LÝ ĐỀ TÀI" contentClassName="topics-content">
      <section className="topics-panel">
        <div className="topics-toolbar">
          <label className="topic-search">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm đề tài..." type="search" />
          </label>
          <button className="topic-add-button" type="button" onClick={openCreateForm}>+ Thêm đề tài</button>
        </div>

        <div className="topic-table-wrap">
          <table className="topic-table">
            <thead><tr><th>STT</th><th>Mã đề tài</th><th>Tên đề tài</th><th>Giảng viên hướng dẫn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {visibleTopics.length === 0 ? <tr><td className="topic-empty" colSpan={6}>Không tìm thấy đề tài phù hợp.</td></tr> : visibleTopics.map((topic, index) => (
                <tr key={topic.id}>
                  <td>{index + 1}</td><td>{topic.code}</td><td>{topic.title}</td><td>{topic.lecturer}</td>
                  <td><span className={`topic-status ${topic.status === 'Đang mở' ? 'open' : 'closed'}`}>{topic.status}</span></td>
                  <td className="topic-actions"><button type="button" onClick={() => openEditForm(topic)}>Sửa</button><button type="button" className="delete" onClick={() => deleteTopic(topic.id)}>Xóa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <div className="topic-modal-backdrop" onMouseDown={closeForm} role="presentation">
          <section className="topic-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="topic-form-title">
            <div className="topic-modal-header"><h3 id="topic-form-title">{editingTopic ? 'Cập nhật đề tài' : 'Thêm đề tài'}</h3><button type="button" onClick={closeForm} aria-label="Đóng">×</button></div>
            <form onSubmit={handleSubmit}>
              <label>Mã đề tài<input value={code} onChange={(event) => setCode(event.target.value)} required /></label>
              <label>Tên đề tài<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
              <label>Giảng viên hướng dẫn<input value={lecturer} onChange={(event) => setLecturer(event.target.value)} required /></label>
              <label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as Topic['status'])}><option>Đang mở</option><option>Đã đóng</option></select></label>
              <div className="topic-modal-actions"><button className="secondary" type="button" onClick={closeForm}>Hủy</button><button type="submit">Lưu</button></div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
