"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

export type Mood = "happy" | "think" | "cheer" | "sad" | "wow";

/** Pip — Waypoint's mascot: a round little navigator with a map-pin antenna. Blinks, bobs, reacts. */
export function Mascot({ mood = "happy", size = 120, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const reduced = useReducedMotion();
  const up = mood === "cheer";
  const ink = "#2a1a10";
  const look = mood === "think" ? { x: 3, y: -5 } : mood === "sad" ? { x: 0, y: 4 } : { x: 2, y: 1 };
  const pr = mood === "wow" ? 10.5 : 8.5;
  return (
    <motion.svg
      viewBox="0 0 160 176"
      width={size}
      height={(size * 176) / 160}
      className={`mascot ${className}`}
      aria-hidden
      animate={reduced ? undefined : up ? { y: [0, -16, 0] } : { y: [0, -4, 0] }}
      transition={{ duration: up ? 0.55 : 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="80" cy="168" rx="40" ry="6" fill="#000" opacity=".35" />
      {/* antenna + pin */}
      <motion.g style={{ originX: 0.5, originY: 1 }} animate={reduced ? undefined : { rotate: up ? [-12, 12, -12] : [-4, 4, -4] }} transition={{ duration: up ? 0.55 : 2.2, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M80 44V26" stroke="#c2510f" strokeWidth="6" strokeLinecap="round" />
        <path d="M80 2c-9 0-16 7-16 15 0 10 16 22 16 22s16-12 16-22c0-8-7-15-16-15Z" fill="#2f8a80" />
        <path d="M80 2c-9 0-16 7-16 15 0 2 .5 4 1.3 6C67 15 73 9 80 9s13 6 14.7 14c.8-2 1.3-4 1.3-6 0-8-7-15-16-15Z" fill="#fff" opacity=".25" />
        <circle cx="80" cy="16" r="5.5" fill="#fff" />
      </motion.g>
      {/* feet */}
      <ellipse cx="60" cy="160" rx="15" ry="8" fill="#ffb020" />
      <ellipse cx="100" cy="160" rx="15" ry="8" fill="#ffb020" />
      {/* wings */}
      <motion.ellipse cx="26" cy="112" rx="13" ry="24" fill="#c2510f" style={{ originX: 0.5, originY: 0.15 }} initial={false} animate={{ rotate: up ? 140 : 18 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} />
      <motion.ellipse cx="134" cy="112" rx="13" ry="24" fill="#c2510f" style={{ originX: 0.5, originY: 0.15 }} initial={false} animate={{ rotate: up ? -140 : -18 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} />
      {/* body */}
      <rect x="22" y="40" width="116" height="122" rx="56" fill="#f26b1d" />
      <rect x="22" y="40" width="116" height="122" rx="56" fill="url(#pip-shade)" />
      <ellipse cx="80" cy="132" rx="36" ry="27" fill="#ffe6cc" />
      <ellipse cx="62" cy="60" rx="22" ry="9" fill="#fff" opacity=".18" transform="rotate(-18 62 60)" />
      <defs>
        <linearGradient id="pip-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#7a2e00" stopOpacity=".45" />
        </linearGradient>
      </defs>
      {/* eyes */}
      <g className="mascot-eyes">
        {up ? (
          <>
            <path d="M46 88q14-16 28 0" stroke={ink} strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M86 88q14-16 28 0" stroke={ink} strokeWidth="7" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="60" cy="86" rx="18" ry="20" fill="#fff" />
            <ellipse cx="100" cy="86" rx="18" ry="20" fill="#fff" />
            <circle cx={62 + look.x} cy={88 + look.y} r={pr} fill={ink} />
            <circle cx={102 + look.x} cy={88 + look.y} r={pr} fill={ink} />
            <circle cx={65 + look.x} cy={84 + look.y} r="3.2" fill="#fff" />
            <circle cx={105 + look.x} cy={84 + look.y} r="3.2" fill="#fff" />
          </>
        )}
      </g>
      {mood === "sad" && (
        <>
          <path d="M44 66l22-6" stroke={ink} strokeWidth="5" strokeLinecap="round" />
          <path d="M116 66l-22-6" stroke={ink} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {/* cheeks */}
      <ellipse cx="40" cy="108" rx="9" ry="5" fill="#f2a07b" opacity=".75" />
      <ellipse cx="120" cy="108" rx="9" ry="5" fill="#f2a07b" opacity=".75" />
      {/* mouth */}
      {mood === "wow" || mood === "think" ? (
        <ellipse cx="80" cy="112" rx={mood === "wow" ? 7 : 5} ry={mood === "wow" ? 9 : 5} fill={ink} />
      ) : mood === "sad" ? (
        <path d="M70 116q10-8 20 0" stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : up ? (
        <path d="M66 106q14 18 28 0Z" fill={ink} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      ) : (
        <path d="M68 108q12 11 24 0" stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
    </motion.svg>
  );
}

/** Mascot + speech bubble, the way every Duolingo question opens. */
export function Prompt({ mood, children, size = 110 }: { mood?: Mood; children: React.ReactNode; size?: number }) {
  return (
    <div className="prompt">
      <Mascot mood={mood} size={size} />
      <motion.div key={String(children)} className="bubble" initial={{ opacity: 0, scale: 0.9, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ type: "spring", stiffness: 420, damping: 26 }}>
        {children}
      </motion.div>
    </div>
  );
}

/** Thick rounded progress bar with the glossy highlight. */
export function Bar({ value, color = "blue", className = "" }: { value: number; color?: "green" | "blue" | "gold" | "red" | "purple"; className?: string }) {
  return (
    <div className={`bar ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <motion.span className={`bar-fill c-${color}`} initial={false} animate={{ width: `${Math.max(value > 0 ? 6 : 0, Math.min(100, value * 100))}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
    </div>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Waypoint home">
      waypoint
    </Link>
  );
}

/* Small illustrated icons in the Duolingo stat-bar style. */
export const Icon = {
  flame: (on = true) => (
    <svg viewBox="0 0 24 28" className="icon" aria-hidden>
      <path d="M12 1c1 5 8 8 8 16a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 4 2 5 0-6 1-9 2-13Z" fill={on ? "#e2483d" : "#6e6b5c"} />
      <path d="M12 14c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 1 2 0-3 0-4 1-6Z" fill={on ? "#e9b949" : "#33332a"} />
    </svg>
  ),
  bolt: () => (
    <svg viewBox="0 0 24 28" className="icon" aria-hidden>
      <path d="M14 1 3 16h7l-2 11 11-15h-7l2-11Z" fill="#e9b949" stroke="#b98a1f" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  gem: () => (
    <svg viewBox="0 0 28 26" className="icon" aria-hidden>
      <path d="M7 2h14l6 7-13 15L1 9l6-7Z" fill="#f26b1d" />
      <path d="M7 2h14l6 7H1l6-7Z" fill="#ff9a5c" />
      <path d="M9 9l5 15 5-15" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
    </svg>
  ),
  brief: () => (
    <svg viewBox="0 0 28 26" className="icon" aria-hidden>
      <rect x="2" y="7" width="24" height="17" rx="4" fill="#3aa59a" />
      <path d="M10 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="#2a7c73" strokeWidth="3" />
      <rect x="2" y="12" width="24" height="3" fill="#2a7c73" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8L12 2Z" fill="currentColor" />
    </svg>
  ),
  crown: () => (
    <svg viewBox="0 0 26 22" className="icon" aria-hidden>
      <path d="M2 6l6 5 5-9 5 9 6-5-2 14H4L2 6Z" fill="currentColor" />
    </svg>
  ),
  redo: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M19 8a8 8 0 1 0 1 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 2v7h-7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <rect x="4" y="10" width="16" height="12" rx="3" fill="currentColor" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M3 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3V4Zm18 0h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V4Z" fill="currentColor" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),
  back: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mic: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <rect x="8" y="2" width="8" height="13" rx="4" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  home: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11Z" fill="currentColor" />
    </svg>
  ),
  map: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" fill="currentColor" opacity=".35" />
      <path d="M9 3v16m6-14v16" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  clock: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".35" />
      <path d="M12 6v6l4 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden>
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),
};

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const fmtHours = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${h} ${h === 1 ? "hour" : "hours"}`);
