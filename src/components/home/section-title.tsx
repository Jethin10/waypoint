"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useViewport } from "./hooks";

/**
 * Huge words laid on the 12-col grid. The block moves in 3vh steps (choppy, deliberate)
 * while each word drifts smoothly — the same layered parallax as the reference.
 */
export function SectionTitle({
  words,
  progress,
  variant,
  link,
  linkInside,
  travel = 0.4,
  travelClamped = 0.6,
}: {
  words: string[];
  progress: MotionValue<number>;
  variant: string;
  link?: React.ReactNode;
  linkInside?: React.ReactNode;
  travel?: number;
  travelClamped?: number;
}) {
  const vh = useViewport();
  const step = vh * 0.03;
  const blockY = useTransform(progress, (p) => {
    const raw = -travelClamped * vh * p + travelClamped * vh * 0.5;
    return Math.round(raw / step) * step;
  });
  const wordY = useTransform(progress, (p) => -travel * vh * p + travel * vh * 0.5);
  const linkY = useTransform(progress, (p) => -0.4 * vh * p + 0.2 * vh);

  return (
    <motion.div className={`lp-title ${variant}`} style={{ y: blockY }}>
      <h2>
        {words.map((w, i) => (
          <motion.span key={i} style={{ y: wordY }}>
            <span>
              {w}
              {i === words.length - 1 && linkInside}
            </span>
          </motion.span>
        ))}
        {link && (
          <motion.span className="link" style={{ y: linkY }}>
            {link}
          </motion.span>
        )}
      </h2>
    </motion.div>
  );
}

/** Sticky footer-line subtitle with words spread edge to edge. */
export function Subtitle({ text }: { text: string }) {
  return (
    <div className="lp-subtitle">
      <h2>
        {text.split(" ").map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </h2>
    </div>
  );
}
