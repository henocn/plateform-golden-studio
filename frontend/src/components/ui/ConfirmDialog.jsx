import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr ? Cette action est irréversible.',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-danger-500" />
        </div>
        <p className="text-body-md text-ink-700 pt-2">{message}</p>
      </div>
    </Modal>
  );
}
