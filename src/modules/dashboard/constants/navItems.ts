// src/modules/dashboard/constants/navItems.ts
import type { UserRole } from '../../auth/types/auth.type'

export type NavItem = {
    label: string
    icon: string
    href: string
    roles?: UserRole[]
}

const navigationItems: NavItem[] = [
    { label: 'Chương trình đào tạo', icon: '▤', href: '/dashboard' },
    { label: 'Quản lý khoa/phòng ban', icon: '▦', href: '/departments', roles: ['ADMIN'] },
    { label: 'Quản lý chuyên môn', icon: '▣', href: '/expertisetags', roles: ['ADMIN'] },
    { label: 'Quản lý giảng viên', icon: '▥', href: '/lecturers', roles: ['ADMIN'] },
    // { label: 'Quản lý kỳ đăng ký', icon: '◴', href: '#!', roles: ['ADMIN'] },
    // { label: 'Quản lý nhóm sinh viên', icon: '★', href: '#!' },
    { label: 'Quản lý sinh viên', icon: '●', href: '/students', roles: ['ADMIN', 'LECTURER'] },
    // { label: 'Quản lý đề tài', icon: '▧', href: '#!' },
    // { label: 'Quản lý đăng ký đề tài', icon: '▨', href: '#!' },
]

export const navItems = navigationItems.map((item) =>
    item.href === '/dashboard' ? { ...item, label: 'Thông tin cá nhân' } : item,
)


