import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import ReactDOM from "react-dom";

type ToastKind = "success" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };
type ToastCtx = { addToast: (message: string, kind: ToastKind) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, kind: ToastKind) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {ReactDOM.createPortal(
        <div className="toastStack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.kind}`}>
              <span className="toastIcon">{t.kind === "success" ? "✓" : "✕"}</span>
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return {
    success: (msg: string) => ctx.addToast(msg, "success"),
    error: (msg: string) => ctx.addToast(msg, "error"),
  };
}
