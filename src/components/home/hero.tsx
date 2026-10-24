"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { cubicBezier, useViewport } from "./hooks";
import { Printer } from "./printer";

// Reel footage from 2xA Studio (https://2xa.studio), used with credit.
const REEL = "https://2xa.studio/media/pages/home/ab4db52e77-1778072983/2xa_reel.mp4";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const vh = useViewport();
  // "top top" → "bottom bottom" of the 150vh reel, eased like quickTo(expo.out).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const linear = useSpring(scrollYProgress, { stiffness: 170, damping: 30, mass: 0.5 });
  const bezier = useTransform(linear, (p) => cubicBezier(p, 0.5, 0, 1, 0.5));
  const footageY = useTransform(bezier, (b) => -0.5 * vh * b);
  const textY = useTransform(linear, (p) => 0.1 * vh * p);

  return (
    <div className="lp-reel" ref={ref}>
      <motion.div className="footage" style={{ y: footageY }}>
        <div className="inner">
          <video src={REEL} autoPlay muted loop playsInline preload="auto" aria-label="Showreel" />
        </div>
      </motion.div>
      <motion.div className="text" style={{ y: textY }}>
        <Printer word="WAYPOINT" progress={linear} label="Waypoint" />
      </motion.div>
    </div>
  );
}
