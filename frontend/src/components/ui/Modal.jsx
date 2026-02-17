import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closable = true,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape' && closable) onClose();
    };
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, closable, onClose]);

  if (!open) return null;

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && closable && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        className={`
          relative w-full ${sizeMap[size]}
          bg-white rounded-2xl shadow-modal
          animate-slide-up
          max-h-[85vh] flex flex-col
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <h2 className="text-display-sm text-ink-900">{title}</h2>
          {closable && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-surface-100 transition-default"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-surface-200 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
