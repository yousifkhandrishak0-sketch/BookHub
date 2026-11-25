import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
              ? AlertCircle
              : Info;
        const tone =
          toast.type === 'success'
            ? 'border-emerald-200 bg-white text-[#202A36]'
            : toast.type === 'error'
              ? 'border-red-200 bg-white text-[#202A36]'
              : 'border-[#E2E7EE] bg-white text-[#202A36]';
        const iconTone =
          toast.type === 'success'
            ? 'text-emerald-700'
            : toast.type === 'error'
              ? 'text-red-700'
              : 'text-[#173B67]';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${tone}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconTone}`} aria-hidden="true" />
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-1 text-[#526071] hover:bg-[#F7F8FA]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
