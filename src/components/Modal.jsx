import { useEffect } from 'react'

export default function Modal({ onClose, title, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-slate-900/60 backdrop-blur-sm p-5"
      onClick={onClose}
    >
      <div
        className="animate-modal-in relative max-h-[calc(100vh-40px)] w-[min(540px,100%)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <h2 id="modal-title" className="text-base font-extrabold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-lg bg-slate-100 text-base leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
            onClick={onClose}
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
