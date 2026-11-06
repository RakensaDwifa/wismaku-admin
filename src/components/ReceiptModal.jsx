export default function ReceiptModal({ booking, onClose }) {
  if (!booking) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl print:max-h-none print:w-full print:border-0 print:shadow-none print:p-6">
        {/* Controls - Disembunyikan saat cetak fisik */}
        <div className="no-print mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">
              Voucher Check-In
            </span>
            <span className="font-mono text-xs font-bold text-slate-500">#{booking.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition"
            >
              🖨️ Cetak Struk
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Template Dokumen Cetak Fisik */}
        <div id="printable-receipt" className="space-y-5 text-slate-800 print:text-black">
          {/* Header Dokumen */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                {booking.propertyName}
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Tanda Terima & Voucher Registrasi Check-In Front Desk
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Diterbitkan:{' '}
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-black text-teal-800">#{booking.id}</div>
              <div className="mt-1 inline-block rounded border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-800">
                LUNAS / CONFIRMED
              </div>
            </div>
          </div>

          {/* Informasi Tamu & Penginapan */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border border-slate-200 p-3 space-y-1.5">
              <span className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Data Tamu Menginap
              </span>
              <div>
                <span className="text-slate-500">Nama Lengkap:</span>
                <p className="font-bold text-slate-900">{booking.guestName}</p>
              </div>
              <div>
                <span className="text-slate-500">Nomor Telepon:</span>
                <p className="font-mono font-bold text-slate-800">{booking.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-mono text-slate-700">{booking.email || '—'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 space-y-1.5">
              <span className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Detail Kamar & Jadwal
              </span>
              <div>
                <span className="text-slate-500">Tipe Kamar:</span>
                <p className="font-bold text-slate-900">{booking.roomTypeName || 'Standar'}</p>
              </div>
              <div>
                <span className="text-slate-500">Alokasi Unit:</span>
                <p className="font-semibold text-slate-800">
                  {booking.rooms || 1} Kamar ({booking.nights || 1} Malam)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400">Check-In:</span>
                  <p className="font-bold text-slate-900">{booking.checkIn} (14:00)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Check-Out:</span>
                  <p className="font-bold text-slate-900">{booking.checkOut} (12:00)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rincian Finansial Tamu */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Metode Pembayaran</span>
              <span>{booking.paymentMethod || 'Online Payment Gateway'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-950">
              <span>Total Tarif Pelunasan</span>
              <span className="text-base font-extrabold text-teal-800">
                Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Ketentuan Front Desk */}
          <div className="rounded-lg border border-slate-100 p-3 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Catatan & Ketentuan Resepsionis:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                Tamu wajib menunjukkan kartu tanda pengenal resmi (KTP/Paspor/SIM) saat serah terima kunci.
              </li>
              <li>Waktu check-out maksimal pukul 12:00 WIB. Keterlambatan dapat dikenakan biaya tambahan.</li>
              <li>Simpan struk ini sebagai bukti registrasi yang sah di {booking.propertyName}.</li>
            </ul>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Tamu Menginap,</p>
              <div className="mt-12 border-b border-slate-400 mx-8"></div>
              <p className="mt-1 font-bold text-slate-900">{booking.guestName}</p>
            </div>
            <div>
              <p className="text-slate-500">Petugas Front Desk,</p>
              <div className="mt-12 border-b border-slate-400 mx-8"></div>
              <p className="mt-1 font-bold text-slate-900">{booking.propertyName}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2">
            WismaKu Mitra Extranet Portal • Layanan Reservasi Penginapan & Hotel Nusantara
          </div>
        </div>
      </div>
    </div>
  )
}
