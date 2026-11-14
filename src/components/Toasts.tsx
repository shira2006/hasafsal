import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
interface ToastItem { id: number; kind: Kind; text: string }

interface Api {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const Ctx = createContext<Api | null>(null);

const ICONS: Record<Kind, ReactNode> = {
  success: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  error: <path d="M12 6v7M12 17.5v.5" />,
  info: <path d="M12 11v6M12 7v.5" />,
};

const DURATION: Record<Kind, number> = { success: 3500, info: 3500, error: 6000 };
const MAX = 3;

/** התראות (toasts): הצלחה, שגיאה, מידע. נעלמות לבד, ואפשר לסגור בהקשה. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setList((l) => l.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((kind: Kind, text: string) => {
    setList((l) => {
      if (l.some((t) => t.text === text)) return l; // לא מציגים את אותה הודעה פעמיים במקביל
      const id = nextId.current++;
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION[kind]));
      return [...l, { id, kind, text }].slice(-MAX);
    });
  }, [dismiss]);

  const api = useMemo<Api>(() => ({
    success: (t) => show("success", t),
    error: (t) => show("error", t),
    info: (t) => show("info", t),
  }), [show]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {list.map((t) => (
          <button key={t.id} type="button" className={`toast ${t.kind}`} onClick={() => dismiss(t.id)} role={t.kind === "error" ? "alert" : "status"}>
            <span className="toast-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[t.kind]}</svg>
            </span>
            <span>{t.text}</span>
          </button>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToasts(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error("useToasts must be used inside ToastProvider");
  return api;
}
