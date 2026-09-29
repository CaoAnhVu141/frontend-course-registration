// src/modules/dashboard/constants/navItems.ts
import {
    Building2,
    CalendarClock,
    ClipboardCheck,
    ClipboardList,
    FileText,
    FolderUp,
    Gavel,
    GraduationCap,
    Tags,
    UserRound,
    Users,
    UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '../../auth/types/auth.type'

export type NavItem = {
    label: string
    icon: LucideIcon
    href: string
    roles?: UserRole[]
}

const navigationItems: NavItem[] = [
    { label: 'Chương trình đào tạo', icon: UserRound, href: '/dashboard' },
    { label: 'Quản lý khoa/phòng ban', icon: Building2, href: '/departments', roles: ['ADMIN'] },
    { label: 'Quản lý chuyên môn', icon: Tags, href: '/expertisetags', roles: ['ADMIN'] },
    { label: 'Quản lý giảng viên', icon: GraduationCap, href: '/lecturers', roles: ['ADMIN'] },
    { label: 'Quản lý kỳ đăng ký', icon: CalendarClock, href: '/registration-periods', roles: ['ADMIN'] },
    { label: 'Quản lý nhóm sinh viên', icon: UsersRound, href: '/student-groups', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
    { label: 'Quản lý sinh viên', icon: Users, href: '/students', roles: ['ADMIN', 'LECTURER'] },
    { label: 'Quản lý đề tài', icon: FileText, href: '/topics', roles: ['ADMIN', 'LECTURER'] },
    { label: 'Quản lý đăng ký đề tài', icon: ClipboardCheck, href: '/topic-registrations', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
    { label: 'Quản lý bài nộp', icon: FolderUp, href: '/submissions', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
    { label: 'Quản lý hội đồng', icon: Gavel, href: '/defense-committees', roles: ['ADMIN', 'LECTURER'] },
    { label: 'Phân công đề tài', icon: ClipboardList, href: '/committee-topic-assignments', roles: ['ADMIN'] },
]

export const navItems = navigationItems.map((item) =>
    item.href === '/dashboard' ? { ...item, label: 'Thông tin cá nhân' } : item,
)
