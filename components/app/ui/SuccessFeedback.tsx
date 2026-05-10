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
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const showSuccess = useCallback(
    (msg: string) => {
      clearDismissTimer();
      setMessage(msg);
      dismissTimerRef.current = setTimeout(() => {
        setMessage(null);
        dismissTimerRef.current = null;
      }, DISMISS_MS);
    },
    [clearDismissTimer]
  );

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  const value = useMemo(() => ({ showSuccess }), [showSuccess]);

  return (
    <SuccessFeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[130] flex w-full justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
        <AnimatePresence mode="wait">
          {message ? (
            <motion.div
              key={message}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", damping: 22, stiffness: 380, mass: 0.85 }}
              className={cn(
                "pointer-events-auto flex max-w-[min(100%,20rem)] items-center justify-center gap-3 rounded-xl border border-semantic-green/25 bg-neutral-white px-4 py-3 shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
              )}
            >
              <motion.span
                className="inline-flex shrink-0"
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.08 }}
              >
                <CheckCircle2 className="h-5 w-5 text-semantic-green" aria-hidden />
              </motion.span>
              <p className="text-center text-sm font-medium text-neutral-black">{message}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </SuccessFeedbackContext.Provider>
  );
}
