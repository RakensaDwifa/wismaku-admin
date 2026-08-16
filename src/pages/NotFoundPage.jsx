import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-rd-soft px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-rd">404</p>
        <h1 className="mt-2 text-xl font-extrabold text-rd-text">Halaman tidak ditemukan</h1>
        <Link to="/" className="btn btn-primary mt-6 inline-flex">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
