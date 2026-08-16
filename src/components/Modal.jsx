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
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/55 p-5" onClick={onClose}>
      <div
        className="animate-modal-in relative max-h-[calc(100vh-40px)] w-[min(520px,100%)] overflow-y-auto rounded-2xl bg-white p-6 shadow-rd-lg outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-extrabold text-rd-text">
            {title}
          </h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-rd-soft text-xl leading-none text-rd-muted hover:text-rd"
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
