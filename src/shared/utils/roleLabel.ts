import type { UserRole } from '../../modules/auth/types/auth.type'

const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: 'QUẢN TRỊ VIÊN',
    LECTURER: 'GIẢNG VIÊN',
    STUDENT: 'SINH VIÊN',
}

const ROLE_VALUES: UserRole[] = ['ADMIN', 'LECTURER', 'STUDENT']

export function normalizeRole(role: string): UserRole | null {
    const normalizedRole = role.replace(/^ROLE_/, '').toUpperCase()

    return ROLE_VALUES.includes(normalizedRole as UserRole)
        ? (normalizedRole as UserRole)
        : null
}

export function normalizeRoles(roles?: string[]): UserRole[] {
    if (!roles?.length) {
        return []
    }

    return roles
        .map(normalizeRole)
        .filter((role): role is UserRole => Boolean(role))
}

export function hasRole(roles: string[] | undefined, role: UserRole) {
    return normalizeRoles(roles).includes(role)
}

export function getRoleLabel(roles?: UserRole[]) {
    const normalizedRoles = normalizeRoles(roles)

    if (!normalizedRoles.length) {
        return 'NGƯỜI DÙNG'
    }

    return ROLE_LABELS[normalizedRoles[0]] ?? normalizedRoles[0]
}
