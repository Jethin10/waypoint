"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { useFlyThrough, useProgress } from "./hooks";
import { SectionTitle } from "./section-title";

// Experiment clips from 2xA Studio (https://2xa.studio), used with credit.
const CLIPS = [
  "https://2xa.studio/media/pages/home/f3372335a0-1774017358/video-1-c7mgiz8g8ek.mp4",
  "https://2xa.studio/media/pages/home/9160e10d8a-1778599669/type_deform.mp4",
  "https://2xa.studio/media/pages/home/e8be0ba713-1774017345/screenn.mp4",
  "https://2xa.studio/media/pages/home/b35e46934a-1775055056/no-signal.mp4",
  "https://2xa.studio/media/pages/home/dfa29eb098-1778599525/2xa_studio_wave_effect.mp4",
  "https://2xa.studio/media/pages/home/5ab784106a-1774017406/video-by-loonatiks.design-c6tvmjyga8u.mp4",
];

function Clip({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useFlyThrough(ref);
  return (
    <div className="exp" ref={ref}>
      <motion.div className="vid" style={{ y }}>
        <video src={src} autoPlay muted loop playsInline preload="metadata" />
      </motion.div>
    </div>
  );
}

export function Experiments() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useProgress(ref);
  return (
    <div className="lp-experiments" ref={ref}>
      <SectionTitle variant="t-experiments" words={["Routes", "Live", "Recalculated"]} progress={progress} />
      <div className="list">
        {CLIPS.map((c) => (
          <Clip key={c} src={c} />
        ))}
      </div>
    </div>
  );
}
