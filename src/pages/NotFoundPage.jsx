import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-black text-teal-800">404</p>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Halaman yang Anda tuju mungkin sudah dipindahkan atau dihapus.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
