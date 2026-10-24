"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";

/** Characters scramble, then lock in left to right when the text scrolls into view. */
export function Typer({ text, className = "", speed = 28 }: { text: string; className?: string; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [out, setOut] = useState(text.replace(/\S/g, " "));

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const r = setTimeout(() => setOut(text), 0);
      return () => clearTimeout(r);
    }
    let frame = 0;
    const total = text.length + 8;
    const t = setInterval(() => {
      frame++;
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " ? " " : i < frame - 8 ? c : i < frame ? GLYPHS[(i * 7 + frame * 3) % GLYPHS.length] : " "))
          .join(""),
      );
      if (frame >= total) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [inView, text, speed]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
