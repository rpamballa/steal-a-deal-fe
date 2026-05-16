import React, {useEffect, useRef} from 'react';

type Props = {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  pending = false,
  tone = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={() => {
        if (!pending) onCancel();
      }}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <div className="dialog-body">{body}</div>
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={pending}
            onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={tone === 'danger' ? 'danger-button' : 'primary-button'}
            disabled={pending}
            onClick={onConfirm}>
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
