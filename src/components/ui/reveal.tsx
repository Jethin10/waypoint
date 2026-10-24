"use client";

import { motion } from "motion/react";
import { EASE } from "./motion";

/** Words rise out of a mask one after another. */
export function RevealWords({
  text,
  className = "",
  delay = 0,
  gap = 0.06,
  italicWords = [],
  goldWords = [],
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  gap?: number;
  italicWords?: string[];
  goldWords?: string[];
  once?: boolean;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?]/g, "");
        const italic = italicWords.includes(clean);
        const gold = goldWords.includes(clean);
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
            <motion.span
              className={`inline-block ${italic ? "italic" : ""} ${gold ? "text-gradient-gold pr-[0.06em]" : ""}`}
              variants={{
                hidden: { y: "110%", rotate: 4, opacity: 0 },
                show: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 && " "}
          </span>
        );
      })}
    </motion.span>
  );
}

export function FadeIn({ children, delay = 0, className = "", y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
