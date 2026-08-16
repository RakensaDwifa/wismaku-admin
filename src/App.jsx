import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PageLoader from './components/PageLoader.jsx'
import RequireRole from './guards/RequireRole.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import { useAuth } from './hooks/useAuth.js'

const LoginPage = lazy(() => import('./pages/login/LoginPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const MemberDashboard = lazy(() => import('./pages/member/Dashboard.jsx'))
const MemberOrders = lazy(() => import('./pages/member/Orders.jsx'))
const MitraDashboard = lazy(() => import('./pages/mitra/Dashboard.jsx'))
const PropertiesPage = lazy(() => import('./pages/mitra/Properties.jsx'))
const PropertyFormPage = lazy(() => import('./pages/mitra/PropertyForm.jsx'))
const RoomsPage = lazy(() => import('./pages/mitra/Rooms.jsx'))
const CouponsPage = lazy(() => import('./pages/mitra/Coupons.jsx'))
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'))
const StaffDashboard = lazy(() => import('./pages/staff/Dashboard.jsx'))
const PartnerVerificationPage = lazy(() => import('./pages/staff/PartnerVerification.jsx'))
const PropertyModerationPage = lazy(() => import('./pages/staff/PropertyModeration.jsx'))
const ReviewsPage = lazy(() => import('./pages/staff/Reviews.jsx'))

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'mitra') return <Navigate to="/mitra" replace />
  if (user.role === 'staff') return <Navigate to="/staff" replace />
  return <Navigate to="/member" replace />
}

function Guarded({ roles }) {
  return (
    <RequireRole roles={roles}>
      <AdminLayout />
    </RequireRole>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Guarded roles={['member']} />}>
            <Route path="/member" element={<MemberDashboard />} />
            <Route path="/member/pesanan" element={<MemberOrders />} />
          </Route>

          <Route element={<Guarded roles={['mitra']} />}>
            <Route path="/mitra" element={<MitraDashboard />} />
            <Route path="/mitra/properti" element={<PropertiesPage />} />
            <Route path="/mitra/properti/baru" element={<PropertyFormPage />} />
            <Route path="/mitra/properti/:id" element={<PropertyFormPage />} />
            <Route path="/mitra/properti/:id/kamar" element={<RoomsPage />} />
            <Route path="/mitra/pesanan" element={<OrdersPage />} />
            <Route path="/mitra/kupon" element={<CouponsPage />} />
          </Route>

          <Route element={<Guarded roles={['staff']} />}>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/mitra" element={<PartnerVerificationPage />} />
            <Route path="/staff/properti" element={<PropertyModerationPage />} />
            <Route path="/staff/ulasan" element={<ReviewsPage />} />
            <Route path="/staff/pesanan" element={<OrdersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
