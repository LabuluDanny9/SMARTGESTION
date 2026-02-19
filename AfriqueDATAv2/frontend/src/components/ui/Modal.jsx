export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
