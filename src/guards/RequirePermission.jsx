import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { hasPermission } from '../roles/permissions.js'

export default function RequirePermission({ permission, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!hasPermission(user.role, permission)) return <Navigate to="/" replace />
  return children
}
