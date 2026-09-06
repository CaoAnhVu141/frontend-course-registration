import type { UserRole } from '../../modules/auth/types/auth.type'

const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: 'QUẢN TRỊ VIÊN',
    LECTURER: 'GIẢNG VIÊN',
    STUDENT: 'SINH VIÊN',
}

export function getRoleLabel(roles?: UserRole[]) {
    if (!roles?.length) {
        return 'NGƯỜI DÙNG'
    }

    return ROLE_LABELS[roles[0]] ?? roles[0]
}