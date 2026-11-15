import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { CloseIcon } from './icons';

const overlayLayouts = {
  center: 'items-center justify-center p-4',
  left: 'justify-start',
};

const panelLayouts = {
  center: 'max-h-full rounded-xl border',
  left: 'h-full w-80 max-w-[85vw] animate-slide-in-left border-r',
};

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Where the panel sits: a centered dialog, or a drawer on the left edge. */
  side?: keyof typeof overlayLayouts;
  children: ReactNode;
}

/** Overlay closed by its X button, the Escape key, or a click outside it. */
export function Modal({
  title,
  onClose,
  side = 'center',
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm ${overlayLayouts[side]}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex flex-col border-slate-700 bg-slate-900 shadow-2xl ${panelLayouts[side]}`}
        // clicks on the panel keep the overlay open
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-2 pr-2 pl-4">
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </div>
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
