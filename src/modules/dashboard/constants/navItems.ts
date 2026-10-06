// src/modules/dashboard/constants/navItems.ts
import {
    Bell,
    Building2,
    CalendarClock,
    ClipboardCheck,
    ClipboardList,
    FileText,
    FolderUp,
    Gavel,
    GraduationCap,
    Star,
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

export type NavGroup = {
    title: string
    items: NavItem[]
}

export const navGroups: NavGroup[] = [
    {
        title: 'Cá nhân',
        items: [
            { label: 'Thông tin cá nhân', icon: UserRound, href: '/dashboard' },
            { label: 'Thông báo', icon: Bell, href: '/notifications' },
        ],
    },
    {
        title: 'Danh mục',
        items: [
            { label: 'Quản lý khoa/phòng ban', icon: Building2, href: '/departments', roles: ['ADMIN'] },
            { label: 'Quản lý chuyên môn', icon: Tags, href: '/expertisetags', roles: ['ADMIN'] },
            { label: 'Quản lý giảng viên', icon: GraduationCap, href: '/lecturers', roles: ['ADMIN'] },
            { label: 'Quản lý kỳ đăng ký', icon: CalendarClock, href: '/registration-periods', roles: ['ADMIN'] },
        ],
    },
    {
        title: 'Sinh viên',
        items: [
            { label: 'Quản lý nhóm sinh viên', icon: UsersRound, href: '/student-groups', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
            { label: 'Quản lý sinh viên', icon: Users, href: '/students', roles: ['ADMIN', 'LECTURER'] },
        ],
    },
    {
        title: 'Đề tài',
        items: [
            { label: 'Quản lý đề tài', icon: FileText, href: '/topics', roles: ['ADMIN', 'LECTURER'] },
            { label: 'Quản lý đăng ký đề tài', icon: ClipboardCheck, href: '/topic-registrations', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
            { label: 'Quản lý bài nộp', icon: FolderUp, href: '/submissions', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
        ],
    },
    {
        title: 'Hội đồng',
        items: [
            { label: 'Quản lý hội đồng', icon: Gavel, href: '/defense-committees', roles: ['ADMIN', 'LECTURER'] },
            { label: 'Phân công đề tài', icon: ClipboardList, href: '/committee-topic-assignments', roles: ['ADMIN'] },
            { label: 'Chấm điểm & Kết quả', icon: Star, href: '/evaluations', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
        ],
    },
]

// Danh sách phẳng (giữ lại cho nơi nào cần duyệt toàn bộ mục)
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items)