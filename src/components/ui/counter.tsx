"use client";

import { animate, useInView, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect, useRef } from "react";

/** Number that counts up when it scrolls into view (or when `value` changes). */
export function Counter({ value, className = "", duration = 1.6, format = (n: number) => Math.round(n).toLocaleString() }: { value: number; className?: string; duration?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, value, duration, mv]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}
