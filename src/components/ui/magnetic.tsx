"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  strength?: number;
  disabled?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}

/** A button that leans toward the cursor. Feels physical without being loud. */
export function Magnetic({ children, href, onClick, className = "", strength = 0.3, disabled, type = "button", ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || disabled) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const inner = <motion.span style={{ x: sx, y: sy }} className="relative inline-flex">{children}</motion.span>;

  return (
    <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className="inline-flex" whileTap={{ scale: disabled ? 1 : 0.96 }}>
      {href ? (
        <Link href={href} className={className} aria-label={ariaLabel}>
          {inner}
        </Link>
      ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={className} aria-label={ariaLabel}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}

export const goldButton =
  "group relative inline-flex items-center gap-3 overflow-hidden rounded-[0.15rem] bg-cream px-6 py-3.5 font-mono text-[15px] uppercase tracking-wide text-ink transition-colors duration-300 hover:bg-blue hover:text-cream disabled:cursor-not-allowed disabled:opacity-40";

export const ghostButton =
  "inline-flex items-center gap-2 rounded-[0.15rem] border border-line-strong px-5 py-3 font-mono text-sm uppercase text-cream/90 transition-colors duration-300 hover:bg-cream hover:text-ink";
