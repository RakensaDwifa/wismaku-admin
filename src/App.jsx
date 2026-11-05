import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PageLoader from './components/PageLoader.jsx'
import RequireRole from './guards/RequireRole.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import { useAuth } from './hooks/useAuth.js'

const LoginPage = lazy(() => import('./pages/login/LoginPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const MitraDashboard = lazy(() => import('./pages/mitra/Dashboard.jsx'))
const PropertiesPage = lazy(() => import('./pages/mitra/Properties.jsx'))
const PropertyFormPage = lazy(() => import('./pages/mitra/PropertyForm.jsx'))
const RoomsPage = lazy(() => import('./pages/mitra/Rooms.jsx'))
const CouponsPage = lazy(() => import('./pages/mitra/Coupons.jsx'))
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'))

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to="/mitra" replace />
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <RequireRole roles={['mitra']}>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route path="/mitra" element={<MitraDashboard />} />
            <Route path="/mitra/properti" element={<PropertiesPage />} />
            <Route path="/mitra/properti/baru" element={<PropertyFormPage />} />
            <Route path="/mitra/properti/:id" element={<PropertyFormPage />} />
            <Route path="/mitra/properti/:id/kamar" element={<RoomsPage />} />
            <Route path="/mitra/pesanan" element={<OrdersPage />} />
            <Route path="/mitra/kupon" element={<CouponsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
