"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DISMISS_MS = 4000;

type SuccessFeedbackContextValue = {
  showSuccess: (message: string) => void;
};

const SuccessFeedbackContext = createContext<SuccessFeedbackContextValue | null>(null);

export function useSuccessFeedback(): SuccessFeedbackContextValue {
  const ctx = useContext(SuccessFeedbackContext);
  if (!ctx) {
    throw new Error("useSuccessFeedback must be used within SuccessFeedbackProvider");
  }
  return ctx;
}

export function SuccessFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [layerVisible, setLayerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setMessage(null);
  }, [clearDismissTimer]);

  const showSuccess = useCallback(
    (msg: string) => {
      clearDismissTimer();
      setToastKey((k) => k + 1);
      setLayerVisible(true);
      setMessage(msg);
      dismissTimerRef.current = setTimeout(() => {
        setMessage(null);
        dismissTimerRef.current = null;
      }, DISMISS_MS);
    },
    [clearDismissTimer]
  );

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [message, dismiss]);

  const value = useMemo(() => ({ showSuccess }), [showSuccess]);

  const toastLayer =
    mounted && typeof document !== "undefined" && layerVisible
      ? createPortal(
          <AnimatePresence
            onExitComplete={() => {
              setLayerVisible(false);
            }}
          >
            {message ? (
              <motion.div
                key={toastKey}
                className="fixed inset-0 z-[130]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute inset-0 bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
                  aria-hidden
                  onClick={dismiss}
                />
                <div
                  className={cn(
                    "pointer-events-none relative flex h-full min-h-0 items-center justify-center",
                    "p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
                    "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
                    "md:p-6"
                  )}
                  role="presentation"
                >
                  <motion.div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "pointer-events-auto flex w-full max-w-md min-h-[min(40dvh,14rem)] flex-col items-center justify-center gap-4",
                      "rounded-card border border-dashboard-border bg-dashboard-surface px-6 py-8 shadow-card"
                    )}
                  >
                    <motion.span
                      className="inline-flex shrink-0"
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.06 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-semantic-green" aria-hidden />
                    </motion.span>
                    <p className="text-center font-display text-lg font-semibold text-neutral-black">{message}</p>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <SuccessFeedbackContext.Provider value={value}>
      {children}
      {toastLayer}
    </SuccessFeedbackContext.Provider>
  );
}
