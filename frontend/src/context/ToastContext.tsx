import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastAction { label: string; onClick: () => void }
interface Toast { id: number; message: string; tone: 'default' | 'sage'; action?: ToastAction }
interface ToastApi {
  show: (message: string, tone?: 'default' | 'sage', action?: ToastAction) => void;
}

const Ctx = createContext<ToastApi | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, tone: 'default' | 'sage' = 'default', action?: ToastAction) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, tone, action }]);
    // Give actionable toasts more time so users can react.
    setTimeout(() => dismiss(id), action ? 6000 : 2600);
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-in-up flex items-center gap-3 rounded-full py-3 pl-5 pr-3 text-[15px] font-bold text-white shadow-pop"
            style={{ background: t.tone === 'sage' ? 'var(--color-sage)' : 'var(--color-ink)' }}
          >
            <span className={t.action ? '' : 'pr-2'}>{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="pointer-events-auto rounded-full bg-white/20 px-3.5 py-1.5 text-[14px] font-extrabold text-white transition hover:bg-white/30 active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) return { show: () => {} };
  return v;
}
