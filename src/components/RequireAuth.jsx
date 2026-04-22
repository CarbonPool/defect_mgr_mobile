import { Navigate, useLocation } from 'react-router-dom'
import { DotLoading } from 'antd-mobile'
import { useAuthStore } from '../stores/authStore'

export default function RequireAuth({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-loading">
        <DotLoading color="primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
