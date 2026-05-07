import { useEffect, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <IconClose size={18} stroke={1.7} />
            </button>
          </div>
        ) : (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
          >
            <IconClose size={18} stroke={1.7} />
          </button>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
