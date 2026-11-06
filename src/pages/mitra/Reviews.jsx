import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getReviews, replyReview } from '../../services/review.js'
import { getProperties } from '../../services/property.js'
import StatCard from '../../components/StatCard.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function Reviews() {
  const { user } = useAuth()
  const { data: reviews, refresh } = useData(() => getReviews({ partnerEmail: user?.email }), [user?.email])
  const { data: properties } = useData(() => getProperties({ partnerEmail: user?.email }), [user?.email])

  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [replyingId, setReplyingId] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyError, setReplyError] = useState('')

  if (!reviews || !properties) return <PageLoader />

  const filtered = reviews.filter((r) => {
    if (selectedPropertyId !== 'all' && String(r.propertyId) !== String(selectedPropertyId)) {
      return false
    }
    if (ratingFilter === '5' && r.rating !== 5) return false
    if (ratingFilter === '4' && r.rating !== 4) return false
    if (ratingFilter === 'under4' && r.rating >= 4) return false
    return true
  })

  const totalReviews = reviews.length
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0'
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length
  const repliedCount = reviews.filter((r) => Boolean(r.reply?.replyText)).length
  const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0

  const handleStartReply = (r) => {
    setReplyingId(r.id)
    setReplyInput(r.reply?.replyText || '')
    setReplyError('')
  }

  const handleCancelReply = () => {
    setReplyingId(null)
    setReplyInput('')
    setReplyError('')
  }

  const handleSubmitReply = async (e, reviewId) => {
    e.preventDefault()
    if (!replyInput.trim()) {
      setReplyError('Teks tanggapan tidak boleh kosong.')
      return
    }

    setReplyBusy(true)
    setReplyError('')
    try {
      await replyReview(reviewId, replyInput, user)
      setReplyingId(null)
      setReplyInput('')
      refresh()
    } catch (err) {
      setReplyError(err.message || 'Gagal mengirim balasan.')
    } finally {
      setReplyBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Ulasan & Kepuasan Tamu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Evaluasi feedback langsung dari tamu untuk memantau performa layanan kamar, reputasi penginapan, dan
          berikan tanggapan resmi.
        </p>
      </div>

      {/* Grid Metrik Kepuasan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Skor Rating Rata-rata"
          value={`${avgRating} ★`}
          hint="Skala maksimal 5.0 bintang"
          badge="Rating"
        />
        <StatCard
          label="Total Ulasan Masuk"
          value={totalReviews}
          hint="Feedback tamu terkumpul"
          badge="Ulasan"
        />
        <StatCard
          label="Ulasan Bintang 4-5"
          value={positiveReviews}
          hint={
            totalReviews > 0 ? `${Math.round((positiveReviews / totalReviews) * 100)}% kepuasan positif` : '—'
          }
          badge="Positif"
        />
        <StatCard
          label="Tingkat Respon Mitra"
          value={`${responseRate}%`}
          hint={`${repliedCount} dari ${totalReviews} ulasan ditanggapi`}
          badge={responseRate >= 80 ? 'Optimal' : 'Perlu Respon'}
        />
      </div>

      {/* Bar Filter */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
            Filter Rating:
          </span>
          {[
            { id: 'all', label: 'Semua Bintang' },
            { id: '5', label: '5 Bintang ★' },
            { id: '4', label: '4 Bintang ★' },
            { id: 'under4', label: '≤ 3 Bintang' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRatingFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                ratingFilter === tab.id
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-property" className="text-xs font-bold text-slate-500">
            Properti:
          </label>
          <select
            id="filter-property"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-700"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">Semua Properti ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daftar Ulasan */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-400">
              ★
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">Tidak ada ulasan yang cocok.</p>
            <p className="mt-1 text-xs text-slate-400">
              Coba ganti filter rating atau pilih properti penginapan lain.
            </p>
          </div>
        ) : (
          filtered.map((r) => {
            const isReplying = replyingId === r.id
            const hasReply = Boolean(r.reply?.replyText)

            return (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-800 border border-teal-200">
                      {(r.name || 'Tamu').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{r.name}</span>
                        {r.city && <span className="text-xs text-slate-400">({r.city})</span>}
                        {r.verifiedGuest && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Tamu Terverifikasi
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{r.propertyName}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-500">
                      {'★'.repeat(r.rating || 5)}
                      <span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - (r.rating || 5)))}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{r.date}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 text-xs leading-relaxed text-slate-700">
                  \"{r.text}\"
                </div>

                {/* Tanggapan Resmi Pengelola */}
                {hasReply && !isReplying && (
                  <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-teal-200/60 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Tanggapan Pengelola
                        </span>
                        <span className="font-bold text-teal-900">{r.reply.repliedBy}</span>
                        <span className="text-[11px] text-teal-600">({r.reply.repliedAt})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartReply(r)}
                        className="text-[11px] font-bold text-teal-800 hover:text-teal-950 underline"
                      >
                        Ubah Tanggapan
                      </button>
                    </div>
                    <p className="leading-relaxed text-teal-950 font-medium">{r.reply.replyText}</p>
                  </div>
                )}

                {/* Form Balas Ulasan */}
                {isReplying ? (
                  <form onSubmit={(e) => handleSubmitReply(e, r.id)} className="mt-3 space-y-2">
                    {replyError && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-700">
                        {replyError}
                      </div>
                    )}
                    <textarea
                      rows={3}
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder="Tulis tanggapan atau ucapan terima kasih kepada tamu..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                      required
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelReply}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={replyBusy}
                        className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                      >
                        {replyBusy ? 'Mengirim...' : hasReply ? 'Simpan Perubahan' : 'Kirim Tanggapan'}
                      </button>
                    </div>
                  </form>
                ) : (
                  !hasReply && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartReply(r)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                      >
                        💬 Beri Tanggapan Resmi
                      </button>
                    </div>
                  )
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
