"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Bar, Icon, Mascot } from "@/components/app/shell";

export function Plotting({ lines, title }: { lines: string[]; title?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(v + 1, lines.length)), 850);
    return () => clearInterval(t);
  }, [lines.length]);
  const done = i >= lines.length;

  return (
    <div className="plotting" role="status" aria-live="polite">
      <Mascot mood={done ? "cheer" : "think"} size={150} />
      <h1>{done ? "Your route is ready!" : `Plotting your ${title ?? ""} route…`}</h1>
      <Bar value={i / lines.length} color="blue" />
      <ul>
        {lines.map((line, k) => (
          <motion.li key={line} initial={{ opacity: 0, y: 8 }} animate={{ opacity: k <= i ? 1 : 0.35, y: 0 }} transition={{ delay: k * 0.05 }} className={k < i ? "ok" : ""}>
            <span className="tick">{k < i ? Icon.check() : null}</span>
            {line}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
