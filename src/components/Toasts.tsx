import { useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { ToastMessage } from '../types';

interface ToastsProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const Toasts = ({ toasts, onDismiss }: ToastsProps) => {
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => setTimeout(() => onDismiss(toast.id), 4000));
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onDismiss]);

  return (
    <div className="fixed right-4 top-24 z-40 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <Transition
          key={toast.id}
          appear
          show
          enter="transform transition duration-200"
          enterFrom="translate-x-10 opacity-0"
          enterTo="translate-x-0 opacity-100"
          leave="transform transition duration-200"
          leaveFrom="translate-x-0 opacity-100"
          leaveTo="translate-x-10 opacity-0"
        >
          <div
            role="status"
            className={`rounded border px-3 py-2 text-sm font-semibold shadow-lg ${
              toast.type === 'warning'
                ? 'border-amber-400 bg-amber-100 text-amber-700'
                : toast.type === 'error'
                ? 'border-red-400 bg-red-100 text-red-700'
                : toast.type === 'success'
                ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {toast.message}
          </div>
        </Transition>
      ))}
    </div>
  );
};

export default Toasts;
