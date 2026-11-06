import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getPayouts, getBankInfo, saveBankInfo } from '../../services/payout.js'
import { getBookings } from '../../services/booking.js'
import StatCard from '../../components/StatCard.jsx'
import Badge from '../../components/Badge.jsx'
import FormField from '../../components/FormField.jsx'
import ErrorBanner from '../../components/ErrorBanner.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function Finance() {
  const { user } = useAuth()
  const { data: payouts } = useData(() => getPayouts({ partnerEmail: user?.email }), [user?.email])
  const { data: bookings } = useData(() => getBookings({ partnerEmail: user?.email }), [user?.email])

  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankMessage, setBankMessage] = useState('')
  const [bankError, setBankError] = useState('')

  useEffect(() => {
    if (user) {
      getBankInfo(user).then((info) => {
        if (info) setBankData(info)
      })
    }
  }, [user])

  if (!payouts || !bookings) return <PageLoader />

  const paidBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed')
  const grossRevenue = paidBookings.reduce((a, b) => a + (b.totalPrice || 0), 0)
  const platformFee = paidBookings.reduce(
    (a, b) => a + (b.platformFee || Math.round((b.totalPrice || 0) * 0.15)),
    0,
  )
  const totalNetEarned = grossRevenue - platformFee

  const totalPaidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const pendingBalance = Math.max(0, totalNetEarned - totalPaidOut)

  const handleBankSubmit = async (e) => {
    e.preventDefault()
    setBankSaving(true)
    setBankMessage('')
    setBankError('')

    try {
      await saveBankInfo(user, bankData)
      setBankMessage('Informasi rekening bank berhasil disimpan.')
      setTimeout(() => setBankMessage(''), 4000)
    } catch (err) {
      setBankError(err.message)
    } finally {
      setBankSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Keuangan & Pencairan Dana (Payouts)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Transparansi bagi hasil 85% hak mitra, pelacakan transfer Superadmin HQ, dan pengelolaan rekening
          bank.
        </p>
      </div>

      {/* Grid Metrik Finansial */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Hak Bersih (85%)"
          value={`Rp ${totalNetEarned.toLocaleString('id-ID')}`}
          hint={`Omzet Kotor: Rp ${grossRevenue.toLocaleString('id-ID')}`}
          badge="Net 85%"
        />
        <StatCard
          label="Telah Ditransfer HQ"
          value={`Rp ${totalPaidOut.toLocaleString('id-ID')}`}
          hint="Dana sukses masuk ke rekening"
          badge="Paid"
        />
        <StatCard
          label="Saldo Siap Cair"
          value={`Rp ${pendingBalance.toLocaleString('id-ID')}`}
          hint="Menunggu periode transfer berkala"
          badge={pendingBalance > 0 ? 'Siap Cair' : 'Clear'}
        />
        <StatCard
          label="Rekening Bank Tujuan"
          value={bankData.bankName.split(' ')[0] || 'Belum Ada'}
          hint={bankData.accountNumber ? `No: ${bankData.accountNumber}` : 'Harap lengkapi'}
          badge="Aktif"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Rekening Bank Mitra */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Rekening Tujuan Pencairan</h2>
            <p className="text-xs text-slate-500">
              Pastikan nama pemilik rekening sama dengan nama pengelola/badan usaha Anda.
            </p>
          </div>

          <ErrorBanner message={bankError} onDismiss={() => setBankError('')} />

          {bankMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {bankMessage}
            </div>
          )}

          <form onSubmit={handleBankSubmit} className="space-y-4">
            <FormField label="Nama Bank">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                required
              >
                <option value="">Pilih Bank</option>
                <option value="BCA (Bank Central Asia)">BCA (Bank Central Asia)</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="BRI (Bank Rakyat Indonesia)">BRI (Bank Rakyat Indonesia)</option>
                <option value="BNI (Bank Negara Indonesia)">BNI (Bank Negara Indonesia)</option>
                <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Bank Permata">Bank Permata</option>
                <option value="Bank Danamon">Bank Danamon</option>
              </select>
            </FormField>

            <FormField label="Nomor Rekening">
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono font-semibold text-slate-800 focus:border-teal-700"
                placeholder="misal: 8820192831"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Nama Pemilik Rekening (Sesuai Buku Tabungan)">
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700"
                placeholder="misal: PT Sukma Wisata Ayu"
                value={bankData.accountHolder}
                onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
                required
              />
            </FormField>

            <button
              type="submit"
              disabled={bankSaving}
              className="w-full rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              {bankSaving ? 'Menyimpan...' : 'Simpan Rekening Bank'}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Payout */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat Pencairan Dana</h2>
              <p className="text-xs text-slate-500">
                Daftar transfer bagi hasil yang dikirimkan oleh WismaKu HQ
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {payouts.length} Riwayat
            </span>
          </div>

          {payouts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm font-bold text-slate-600">Belum ada riwayat transfer pencairan.</p>
              <p className="mt-1 text-xs text-slate-400">
                Setelah pesanan selesai menginap, Superadmin HQ akan memproses transfer pencairan sesuai
                jadwal berkala.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">ID & Tanggal</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Jumlah Bersih</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Bukti / No. Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-teal-700">{p.id}</div>
                        <div className="text-[11px] text-slate-400">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {p.period_start} s.d. {p.period_end}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-600">
                          {p.transfer_ref || 'Menunggu Transfer'}
                        </div>
                        {p.paid_at && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Cair: {new Date(p.paid_at).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
