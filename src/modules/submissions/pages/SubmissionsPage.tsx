import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Eye, Search, Upload } from 'lucide-react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading, ExportButton, Pagination } from '../../ui'
import {
  createSubmission,
  createSubmissionFeedback,
  createSubmissionVersion,
  downloadSubmissionVersion,
  getFeedbacksBySubmissionVersion,
  getSubmission,
  getSubmissionByTopicRegistration,
  getSubmissions,
} from '../services/submissionApi'
import type {
  ApiResponse,
  Submission,
  SubmissionFeedback,
  SubmissionVersion,
} from '../types/submission.type'
import {
  getMyTopicRegistrations,
  getTopicRegistration,
} from '../../topicregistrations/services/topicRegistrationApi'
import type { TopicRegistration } from '../../topicregistrations/types/topicRegistration.type'
import './SubmissionsPage.css'

const PAGE_SIZE = 5

export function SubmissionsPage() {
  const { success, error: showError } = useNotification()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const isStudent = hasRole(user?.roles, 'STUDENT')
  const canViewAll = isAdmin || isLecturer
  const canCreateSubmission = isStudent
  const canCreateFeedback = isLecturer

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [search, setSearch] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formTopicRegistrationId, setFormTopicRegistrationId] = useState('')
  const [myRegistrations, setMyRegistrations] = useState<TopicRegistration[]>([])

  // Đăng ký đã duyệt của sinh viên (để chọn khi tạo bài nộp)
  const approvedRegistrations = useMemo(
    () =>
      myRegistrations.filter(
        (registration) => registration.status === 'APPROVED',
      ),
    [myRegistrations],
  )

  // topicRegistrationId -> tên đề tài (để hiển thị thay cho ID)
  const registrationTitleById = useMemo(
    () =>
      new Map(
        myRegistrations.map((registration) => [
          registration.id,
          registration.topicTitle,
        ]),
      ),
    [myRegistrations],
  )

  const registrationTitle = (topicRegistrationId: number) =>
    registrationTitleById.get(topicRegistrationId) ??
    `#${topicRegistrationId}`

  const [versionSubmission, setVersionSubmission] = useState<Submission | null>(null)
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [versionChangeNote, setVersionChangeNote] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const [detailSubmission, setDetailSubmission] = useState<Submission | null>(null)
  const [detailTopicTitle, setDetailTopicTitle] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [feedbackVersion, setFeedbackVersion] = useState<SubmissionVersion | null>(null)
  const [feedbacks, setFeedbacks] = useState<SubmissionFeedback[]>([])
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')

  const visibleSubmissions = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    const sortedSubmissions = [...submissions].sort(
      (first, second) => second.id - first.id,
    )

    if (!keyword) return sortedSubmissions

    return sortedSubmissions.filter((submission) =>
      [
        submission.id,
        submission.topicRegistrationId,
        submission.status ? 'Đang hoạt động' : 'Không còn hoạt động',
        formatDateTime(submission.submittedAt),
        ...(submission.submissionVersions ?? []).map((version) => version.fileName),
      ].some((value) =>
        String(value ?? '').toLocaleLowerCase('vi').includes(keyword),
      ),
    )
  }, [search, submissions])

  const totalPages = Math.max(1, Math.ceil(visibleSubmissions.length / PAGE_SIZE))
  const pagedSubmissions = visibleSubmissions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const loadSubmissions = useCallback(async () => {
    if (!canViewAll) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSubmissions(await getSubmissions())
    } catch (loadError) {
      const message = getErrorMessage(loadError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [canViewAll, showError])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  // Sinh viên: tải đăng ký của nhóm + bài nộp tương ứng (lịch sử đã nộp).
  const loadMyStudentData = useCallback(async () => {
    if (!canCreateSubmission) return

    try {
      setIsLoading(true)
      setError('')
      const registrations = await getMyTopicRegistrations()
      setMyRegistrations(registrations)

      const approved = registrations.filter(
        (registration) => registration.status === 'APPROVED',
      )
      const results = await Promise.allSettled(
        approved.map((registration) =>
          getSubmissionByTopicRegistration(registration.id),
        ),
      )

      const mySubmissions = results
        .filter(
          (result): result is PromiseFulfilledResult<ApiResponse<Submission>> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value.data)

      setSubmissions(mySubmissions)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [canCreateSubmission])

  useEffect(() => {
    void loadMyStudentData()
  }, [loadMyStudentData])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function upsertSubmission(nextSubmission: Submission) {
    setSubmissions((current) => {
      const exists = current.some((item) => item.id === nextSubmission.id)

      return exists
        ? current.map((item) =>
            item.id === nextSubmission.id ? nextSubmission : item,
          )
        : [nextSubmission, ...current]
    })
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const topicRegistrationId = Number(lookupId)

    if (!Number.isInteger(topicRegistrationId) || topicRegistrationId <= 0) {
      showError('ID đăng ký đề tài không hợp lệ.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      const response = await getSubmissionByTopicRegistration(topicRegistrationId)
      upsertSubmission(response.data)
      success(response.message)
    } catch (lookupError) {
      const message = getErrorMessage(lookupError)
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    // Chỉ giữ lại lookupId nếu nó trùng một đăng ký đã duyệt.
    const matched = approvedRegistrations.some(
      (registration) => String(registration.id) === lookupId,
    )
    setFormTopicRegistrationId(matched ? lookupId : '')
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
      const response = await createSubmission({
        topicRegistrationId: formTopicRegistrationId
          ? Number(formTopicRegistrationId)
          : undefined,
      })

      upsertSubmission(response.data)
      success(response.message)
      setIsCreateOpen(false)
    } catch (createError) {
      showError(getErrorMessage(createError))
    } finally {
      setIsSaving(false)
    }
  }

  function openVersionForm(submission: Submission) {
    setVersionSubmission(submission)
    setVersionFile(null)
    setVersionChangeNote('')
  }

  function closeVersionForm() {
    if (isSaving) return
    setVersionSubmission(null)
  }

  async function handleDownload(version: SubmissionVersion) {
    try {
      setDownloadingId(version.id)
      await downloadSubmissionVersion(version.id, version.fileName)
    } catch (downloadError) {
      showError(getErrorMessage(downloadError))
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleVersionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!versionSubmission) return

    if (!versionFile) {
      showError('Vui lòng chọn file báo cáo.')
      return
    }

    try {
      setIsSaving(true)
      const response = await createSubmissionVersion(
        versionSubmission.id,
        versionFile,
        versionChangeNote,
      )

      const nextSubmission = {
        ...versionSubmission,
        submissionVersions: [
          ...(versionSubmission.submissionVersions ?? []),
          response.data,
        ],
      }

      upsertSubmission(nextSubmission)
      setDetailSubmission((current) =>
        current?.id === nextSubmission.id ? nextSubmission : current,
      )
      success(response.message)
      setVersionSubmission(null)
    } catch (versionError) {
      showError(getErrorMessage(versionError))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetail(submission: Submission) {
    try {
      setIsDetailLoading(true)
      setDetailSubmission(submission)
      setDetailTopicTitle(registrationTitleById.get(submission.topicRegistrationId) ?? '')
      const response = await getSubmission(submission.id)
      setDetailSubmission(response.data)
      upsertSubmission(response.data)

      // Lấy đúng tên đề tài theo đăng ký (không phụ thuộc danh sách đã tải).
      try {
        const registration = await getTopicRegistration(
          response.data.topicRegistrationId,
        )
        setDetailTopicTitle(registration.data.topicTitle)
      } catch {
        // Giữ nguyên tên tạm nếu không lấy được.
      }
    } catch (detailError) {
      showError(getErrorMessage(detailError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  function closeDetail() {
    if (isDetailLoading) return
    setDetailSubmission(null)
  }

  async function openFeedback(version: SubmissionVersion) {
    try {
      setIsFeedbackLoading(true)
      setFeedbackVersion(version)
      setFeedbackComment('')
      setFeedbacks(await getFeedbacksBySubmissionVersion(version.id))
    } catch (feedbackError) {
      showError(getErrorMessage(feedbackError))
    } finally {
      setIsFeedbackLoading(false)
    }
  }

  function closeFeedback() {
    if (isSaving) return
    setFeedbackVersion(null)
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feedbackVersion) return

    try {
      setIsSaving(true)
      const response = await createSubmissionFeedback({
        submissionVersionId: feedbackVersion.id,
        comment: feedbackComment.trim(),
      })

      setFeedbacks((current) => [...current, response.data])
      setFeedbackComment('')
      success(response.message)
    } catch (feedbackError) {
      showError(getErrorMessage(feedbackError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout title="QUẢN LÝ BÀI NỘP" contentClassName="submissions-content">
      <section className="submissions-panel">
        <div className="submissions-toolbar">
          <label className="submission-search-field">
            <span>Tìm kiếm</span>
            <div className="submission-search">
              <Search aria-hidden="true" size={17} strokeWidth={2} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm bài nộp..."
              />
            </div>
          </label>

          <form
            className="submission-lookup-field"
            onSubmit={(event) => void handleLookup(event)}
          >
            <span>ID đăng ký</span>
            <div className="submission-lookup">
              <input
                type="number"
                min={1}
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
                placeholder="ID đăng ký đề tài"
              />
              <button type="submit" disabled={isLoading}>
                Tra cứu
              </button>
            </div>
          </form>

          <div className="submission-toolbar-actions">
            <ExportButton
              fileName="danh-sach-bai-nop"
              rows={[
                ['ID', 'Đề tài', 'Ngày nộp', 'Số phiên bản', 'File mới nhất', 'Trạng thái'],
                ...visibleSubmissions.map((submission) => {
                  const versions = submission.submissionVersions ?? []
                  const latestVersion = versions[versions.length - 1]

                  return [
                    submission.id,
                    registrationTitle(submission.topicRegistrationId),
                    formatDateTime(submission.submittedAt),
                    versions.length,
                    latestVersion?.fileName ?? 'Chưa có báo cáo',
                    submission.status ? 'Đang hoạt động' : 'Không còn hoạt động',
                  ]
                }),
              ]}
              disabled={!canViewAll || isLoading || visibleSubmissions.length === 0}
            />

            {canCreateSubmission && (
              <button
                className="submission-add-button"
                type="button"
                onClick={openCreateForm}
              >
                <span>+</span> Tạo bài nộp
              </button>
            )}
          </div>
        </div>

        {error && <div className="submission-message error">{error}</div>}
        {!canViewAll && canCreateSubmission && (
          <div className="submission-message info">
            Danh sách bài nộp của nhóm bạn. Mỗi đăng ký đề tài có một bài nộp và
            có thể nộp nhiều phiên bản báo cáo — xem lịch sử trong phần Chi tiết.
          </div>
        )}

        <div className="submission-table-wrap">
          <table className="submission-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Đăng ký đề tài</th>
                <th>Ngày tạo</th>
                <th>Số phiên bản</th>
                <th>Phiên bản mới nhất</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="submission-empty" colSpan={7}>
                    <AppLoading />
                  </td>
                </tr>
              ) : pagedSubmissions.length === 0 ? (
                <tr>
                  <td className="submission-empty" colSpan={7}>
                    {canViewAll
                      ? 'Không tìm thấy bài nộp.'
                      : 'Nhóm bạn chưa có bài nộp nào.'}
                  </td>
                </tr>
              ) : (
                pagedSubmissions.map((submission, index) => {
                  const versions = submission.submissionVersions ?? []
                  const latestVersion = versions[versions.length - 1]

                  return (
                    <tr
                      key={submission.id}
                      className={submission.status ? '' : 'inactive-row'}
                    >
                      <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{registrationTitle(submission.topicRegistrationId)}</td>
                      <td>{formatDateTime(submission.submittedAt)}</td>
                      <td>{versions.length}</td>
                      <td>
                        <span className="submission-file">
                          {latestVersion?.fileName ?? 'Chưa có báo cáo'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`submission-status ${
                            submission.status ? 'active' : 'inactive'
                          }`}
                        >
                          {submission.status
                            ? 'Đang hoạt động'
                            : 'Không còn hoạt động'}
                        </span>
                      </td>
                      <td className="submission-actions-cell">
                        <div className="submission-actions">
                          <button
                            type="button"
                            onClick={() => void openDetail(submission)}
                          >
                            <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                            <span>Chi tiết</span>
                          </button>

                          {canCreateSubmission && (
                            <button
                              type="button"
                              className="upload"
                              onClick={() => openVersionForm(submission)}
                            >
                              <Upload aria-hidden="true" size={16} strokeWidth={1.9} /> <span>Nộp báo cáo</span>
                            </button>
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
          ariaLabel="Phân trang bài nộp"
        />
      </section>

      {isCreateOpen && (
        <div
          className="submission-modal-backdrop"
          onMouseDown={closeCreateForm}
          role="presentation"
        >
          <section
            className="submission-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-form-title"
          >
            <div className="submission-modal-header">
              <h3 id="submission-form-title">Tạo bài nộp</h3>
              <button type="button" onClick={closeCreateForm} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={(event) => void handleCreateSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="submission-registration">
                  Đăng ký đề tài
                </label>
                <select
                  className="form-control"
                  id="submission-registration"
                  autoFocus
                  required
                  value={formTopicRegistrationId}
                  onChange={(event) =>
                    setFormTopicRegistrationId(event.target.value)
                  }
                >
                  <option value="">Chọn đăng ký đề tài</option>
                  {approvedRegistrations.map((registration) => (
                    <option key={registration.id} value={registration.id}>
                      {registration.studentGroupName} — {registration.topicTitle}
                    </option>
                  ))}
                </select>
                {approvedRegistrations.length === 0 && (
                  <p className="submission-note">
                    Nhóm bạn chưa có đăng ký đề tài nào đã được duyệt để nộp báo
                    cáo.
                  </p>
                )}
              </div>

              <div className="submission-note">
                Đăng ký đề tài phải ở trạng thái đã duyệt và chưa có bài nộp nào.
              </div>

              <div className="submission-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeCreateForm}
                >
                  Hủy
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang tạo...' : 'Tạo bài nộp'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {versionSubmission && (
        <div
          className="submission-modal-backdrop"
          onMouseDown={closeVersionForm}
          role="presentation"
        >
          <section
            className="submission-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-version-title"
          >
            <div className="submission-modal-header">
              <h3 id="submission-version-title">
                Nộp báo cáo - bài nộp #{versionSubmission.id}
              </h3>
              <button type="button" onClick={closeVersionForm} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={(event) => void handleVersionSubmit(event)}>
              <div className="form-field">
                <label className="form-label" htmlFor="submission-file">
                  Chọn file báo cáo
                </label>
                <input
                  className="form-control submission-file-input"
                  id="submission-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.zip,.rar"
                  onChange={(event) =>
                    setVersionFile(event.target.files?.[0] ?? null)
                  }
                />
                {versionFile && (
                  <p className="submission-file-picked">
                    Đã chọn: <strong>{versionFile.name}</strong> (
                    {formatFileSize(versionFile.size)})
                  </p>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="submission-change-note">
                  Ghi chú thay đổi
                </label>
                <textarea
                  className="form-control"
                  id="submission-change-note"
                  rows={3}
                  value={versionChangeNote}
                  onChange={(event) => setVersionChangeNote(event.target.value)}
                  placeholder="VD: Bản báo cáo lần 1"
                />
              </div>

              <div className="submission-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={closeVersionForm}
                >
                  Hủy
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang nộp...' : 'Nộp báo cáo'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailSubmission && (
        <div
          className="submission-modal-backdrop"
          onMouseDown={closeDetail}
          role="presentation"
        >
          <section
            className="submission-modal submission-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-detail-title"
          >
            <div className="submission-modal-header">
              <h3 id="submission-detail-title">Chi tiết bài nộp</h3>
              <button type="button" onClick={closeDetail} aria-label="Đóng">
                ×
              </button>
            </div>
            <div className="submission-detail">
              {isDetailLoading ? (
                <AppLoading />
              ) : (
                <>
                  <dl className="submission-detail-grid">
                    <dt>Đề tài</dt>
                    <dd>
                      {detailTopicTitle ||
                        registrationTitle(detailSubmission.topicRegistrationId)}
                    </dd>
                    <dt>Ngày tạo</dt>
                    <dd>{formatDateTime(detailSubmission.submittedAt)}</dd>
                    <dt>Trạng thái</dt>
                    <dd>
                      <span
                        className={`submission-status ${
                          detailSubmission.status ? 'active' : 'inactive'
                        }`}
                      >
                        {detailSubmission.status
                          ? 'Đang hoạt động'
                          : 'Không còn hoạt động'}
                      </span>
                    </dd>
                  </dl>

                  <table className="submission-version-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên file</th>
                        <th>Kích thước</th>
                        <th>Ghi chú</th>
                        <th>Người nộp</th>
                        <th>Tải xuống</th>
                        <th>Góp ý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailSubmission.submissionVersions ?? []).length === 0 ? (
                        <tr>
                          <td className="submission-empty" colSpan={7}>
                            Chưa có phiên bản báo cáo nào.
                          </td>
                        </tr>
                      ) : (
                        detailSubmission.submissionVersions.map((version) => (
                          <tr key={version.id}>
                            <td>{version.id}</td>
                            <td>{version.fileName}</td>
                            <td>{formatFileSize(version.fileSize)}</td>
                            <td>{version.changeNote || '-'}</td>
                            <td>{version.uploadedBy}</td>
                            <td>
                              <button
                                type="button"
                                className="submission-download-button"
                                disabled={downloadingId === version.id}
                                onClick={() => void handleDownload(version)}
                                title="Tải file báo cáo"
                              >
                                <Download
                                  aria-hidden="true"
                                  size={15}
                                  strokeWidth={1.9}
                                />
                                {downloadingId === version.id
                                  ? 'Đang tải...'
                                  : 'Tải xuống'}
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="submission-feedback-button"
                                onClick={() => void openFeedback(version)}
                              >
                                {canCreateFeedback ? 'Góp ý' : 'Xem góp ý'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {feedbackVersion && (
        <div
          className="submission-modal-backdrop"
          onMouseDown={closeFeedback}
          role="presentation"
        >
          <section
            className="submission-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-feedback-title"
          >
            <div className="submission-modal-header">
              <h3 id="submission-feedback-title">
                Góp ý - {feedbackVersion.fileName}
              </h3>
              <button type="button" onClick={closeFeedback} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="submission-feedback-list">
              {isFeedbackLoading ? (
                <AppLoading label="Đang tải góp ý" />
              ) : feedbacks.length === 0 ? (
                <p className="submission-feedback-empty">
                  Chưa có góp ý cho phiên bản này.
                </p>
              ) : (
                feedbacks.map((feedback) => (
                  <article className="submission-feedback-item" key={feedback.id}>
                    <header>
                      <strong>{feedback.lecturerCode}</strong>
                      <span>{feedback.lecturerEmail}</span>
                    </header>
                    <p>{feedback.comment}</p>
                  </article>
                ))
              )}
            </div>

            {canCreateFeedback && (
              <form onSubmit={(event) => void handleFeedbackSubmit(event)}>
                <div className="form-field">
                  <label className="form-label" htmlFor="submission-feedback-comment">
                    Nội dung góp ý
                  </label>
                  <textarea
                    className="form-control"
                    id="submission-feedback-comment"
                    required
                    rows={4}
                    value={feedbackComment}
                    onChange={(event) => setFeedbackComment(event.target.value)}
                    placeholder="Nhập góp ý cho báo cáo"
                  />
                </div>

                <div className="submission-modal-actions">
                  <button
                    className="secondary"
                    type="button"
                    onClick={closeFeedback}
                  >
                    Đóng
                  </button>
                  <button type="submit" disabled={isSaving}>
                    {isSaving ? 'Đang gửi...' : 'Gửi góp ý'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

function formatFileSize(fileSize: number) {
  if (!fileSize) return '-'

  if (fileSize < 1024) return `${fileSize} B`

  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
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
