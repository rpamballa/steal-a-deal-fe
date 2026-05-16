import React, {useEffect, useState} from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

function push(tone: ToastTone, message: string) {
  const id = nextId++;
  toasts = [...toasts, {id, tone, message}];
  emit();
  const ttl = tone === 'error' ? 7000 : 4000;
  window.setTimeout(() => dismiss(id), ttl);
}

function dismiss(id: number) {
  toasts = toasts.filter(toast => toast.id !== id);
  emit();
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
  dismiss,
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>(toasts);

  useEffect(() => {
    const listener: Listener = next => setItems([...next]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications" aria-live="polite">
      {items.map(item => (
        <div key={item.id} className={`toast toast-${item.tone}`} role="status">
          <span className="toast-message">{item.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss"
            onClick={() => dismiss(item.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
