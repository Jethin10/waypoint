"use client";

import { useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useState, type RefObject } from "react";

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

// Approximates GSAP quickTo(..., { duration: 1, ease: "expo.out" }), which the reference uses everywhere.
const QUICK = { stiffness: 170, damping: 30, mass: 0.5 };

/** Scroll progress of an element (default: "top bottom" → "bottom top"), eased. */
export function useProgress(ref: RefObject<HTMLElement | null>, offset: Offset = ["start end", "end start"]): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return useSpring(scrollYProgress, QUICK);
}

/** Item fly-through: rushes in from below, holds in place through the middle, rushes out the top. */
export const hold = (r: number, k = 5) => {
  const x = Math.min(1, Math.max(0, r)) * 2 - 1;
  return 0.5 + 0.5 * Math.sign(x) * Math.abs(x) ** k;
};

/** translateY(calc(-200vh * p + 100vh)) driven by the hold curve. */
export function useFlyThrough(ref: RefObject<HTMLElement | null>) {
  const vh = useViewport();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(useTransform(scrollYProgress, (r) => hold(r)), QUICK);
  return useTransform(p, (v) => (-2 * v + 1) * vh);
}

/** CSS cubic-bezier evaluated as a function of x. */
export function cubicBezier(x: number, x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 30; i++) {
    t = (lo + hi) / 2;
    if (X(t) < x) lo = t;
    else hi = t;
  }
  return Y(t);
}

export function useViewport() {
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const set = () => setVh(window.innerHeight);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  return vh;
}

/** Footer printer: prints from "top center" to "bottom bottom", like the reference footer. */
export function useScrollPrint(ref: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end end"] });
  return useSpring(scrollYProgress, QUICK);
}
