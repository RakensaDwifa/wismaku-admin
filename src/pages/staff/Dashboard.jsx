import { useData } from '../../hooks/useData.js'
import { getPendingPartners } from '../../services/partner.js'
import { getProperties } from '../../services/property.js'
import { getBookings } from '../../services/booking.js'
import { getReviews } from '../../services/review.js'
import StatCard from '../../components/StatCard.jsx'
import PageLoader from '../../components/PageLoader.jsx'
import { Link } from 'react-router-dom'

export default function StaffDashboard() {
  const { data: pending } = useData(() => getPendingPartners(), [])
  const { data: properties } = useData(() => getProperties(), [])
  const { data: bookings } = useData(() => getBookings(), [])
  const { data: reviews } = useData(() => getReviews(), [])

  if (!pending || !properties || !bookings || !reviews) return <PageLoader />

  const nonaktif = properties.filter((p) => p.status !== 'aktif').length
  const pendingReviews = reviews.filter((r) => r.status !== 'aktif').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-rd-text">Dashboard Operasional</h1>
        <p className="text-sm text-rd-muted">Ringkasan tugas verifikasi dan moderasi.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/staff/mitra" className="block">
          <StatCard label="Mitra Menunggu Verifikasi" value={pending.length} />
        </Link>
        <Link to="/staff/properti" className="block">
          <StatCard label="Properti Perlu Perhatian" value={nonaktif} />
        </Link>
        <Link to="/staff/ulasan" className="block">
          <StatCard label="Ulasan Perlu Moderasi" value={pendingReviews} />
        </Link>
        <Link to="/staff/pesanan" className="block">
          <StatCard label="Total Pesanan" value={bookings.length} />
        </Link>
      </div>
    </div>
  )
}
