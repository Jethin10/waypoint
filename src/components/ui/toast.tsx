"use client";

import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { EASE } from "./motion";

type Tone = "gold" | "ember" | "neutral";
interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: Tone;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "tone"> & { tone?: Tone }) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, tone: "neutral", ...t }] });
    setTimeout(() => get().dismiss(id), 5200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (t: Omit<Toast, "id" | "tone"> & { tone?: Tone }) => useToasts.getState().push(t);

const dot: Record<Tone, string> = { gold: "#58cc02", ember: "#ff4b4b", neutral: "#1cb0f6" };

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="wp-toast pointer-events-auto"
          >
            <span className="wp-toast-dot" style={{ background: dot[t.tone] }} />
            <span>
              <span className="wp-toast-title">{t.title}</span>
              {t.body && <span className="wp-toast-body">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
