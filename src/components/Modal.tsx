import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.section
            role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`modal ${title.toLowerCase().includes('project') ? 'modal-project' : ''}`}
            initial={{ opacity: 0, y: 12, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: .99 }} transition={{ duration: .18 }}
          >
            <header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></header>
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
