import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { DashboardLayout } from '../components/DashboardLayout'

const studentDetails = [
  ['Mã sinh viên', '2212223'],
  ['Họ tên', 'Nguyễn Văn A'],
  ['Ngày sinh', '24/05/2004'],
  ['Nơi sinh', 'Thành phố Hồ Chí Minh'],
  ['Nơi đăng ký khai sinh', ''],
  ['Giới tính', 'Nam'],
  ['CMND/CCCD', '43253456456'],
  ['Dân tộc', 'Kinh'],
  ['Tôn giáo', 'Công giáo'],
  ['Lớp giáo viên phụ trách', '25LC10SP3'],
]

const contactDetails = [
  ['Quốc gia', 'Vietnam'],
  ['Tỉnh thành', 'Thành phố Hồ Chí Minh'],
  ['Phường/xã', ''],
  ['Địa chỉ', 'Phường Tân Phú, Thành phố Hồ Chí Minh'],
  ['Di động', '0999999999'],
  ['Email trường', '2999999@student.hcmute.edu.vn'],
  ['Email cá nhân', 'admin@gmail.com'],
]

const courseDetails = [
  ['Khóa dạy', 'Khóa 2025'],
  ['Ngành dạy', 'VLVH_liên thông Cao Đẳng'],
  ['Chương trình đào tạo', 'K25LC10(3)'],
  ['Khoa', 'Phòng Đào tạo (VLVH)'],
  ['Ngành', 'Công nghệ thông tin'],
  ['Niên khóa', '2025 - 2027'],
  ['Năm hết thời gian đào tạo', '2025 - 2027'],
]

type DetailCardProps = {
  title: string
  details: string[][]
}

function DetailCard({ title, details }: DetailCardProps) {
  return (
    <section className="profile-card">
      <h2>{title}</h2>
      <dl>
        {details.map(([label, value]) => (
          <div className="profile-row" key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function DashboardPage() {
  const [isLoginMessageVisible, setIsLoginMessageVisible] = useState(false)

  useEffect(() => {
    const shouldShowMessage =
      sessionStorage.getItem(STORAGE_KEYS.loginSuccessMessage) === 'true'

    if (!shouldShowMessage) return

    sessionStorage.removeItem(STORAGE_KEYS.loginSuccessMessage)
    setIsLoginMessageVisible(true)
  }, [])

  useEffect(() => {
    if (!isLoginMessageVisible) return

    const timeoutId = window.setTimeout(() => {
      setIsLoginMessageVisible(false)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [isLoginMessageVisible])

  return (
    <DashboardLayout>
      <div className="personal-information">
        <DetailCard title="Thông tin giáo viên" details={studentDetails} />

        <div className="profile-card-column">
          <DetailCard title="Thông tin liên lạc" details={contactDetails} />
        </div>

        <DetailCard title="Thông tin khóa dạy" details={courseDetails} />
      </div>

      {isLoginMessageVisible && (
        <div className="success-modal-backdrop">
          <section className="success-panel" role="status">
            <div className="success-icon">✓</div>
            <div>
              <h1>Đăng nhập thành công</h1>
              <p>Bạn đã đăng nhập vào hệ thống Course Registration.</p>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
