export const ROLES = ['member', 'mitra', 'staff', 'superadmin']

export const roleLabels = {
  member: 'Konsumen',
  mitra: 'Mitra',
  staff: 'Staff',
  superadmin: 'Super Admin',
}

export const rolePermissions = {
  member: ['member.view'],
  mitra: [
    'dashboard.view',
    'property.view',
    'property.create',
    'property.update',
    'property.delete',
    'room.view',
    'room.create',
    'room.update',
    'room.delete',
    'order.view',
    'order.update',
    'coupon.view',
    'coupon.create',
    'coupon.update',
    'coupon.delete',
  ],
  staff: [
    'dashboard.view',
    'partner.view',
    'partner.verify',
    'property.view',
    'property.moderate',
    'review.view',
    'review.moderate',
    'order.view',
    'order.update',
  ],
  superadmin: ['*'],
}

export const hasPermission = (role, permission) => {
  const perms = rolePermissions[role] || []
  return perms.includes('*') || perms.includes(permission)
}

export const ALL_PERMISSIONS = Object.values(rolePermissions).flat()
