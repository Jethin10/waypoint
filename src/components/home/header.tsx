"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function Clock({ label, zone, blinkOffset }: { label: string; zone: string; blinkOffset: number }) {
  const [now, setNow] = useState<Date | null>(null);
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t0 = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 1000);
    let b: ReturnType<typeof setInterval> | undefined;
    const d = setTimeout(() => {
      b = setInterval(() => setOn((v) => !v), 1000);
    }, blinkOffset);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
      clearTimeout(d);
      if (b) clearInterval(b);
    };
  }, [blinkOffset]);
  const parts = now
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone }).formatToParts(now)
    : [];
  const h = parts.find((p) => p.type === "hour")?.value ?? "--";
  const m = parts.find((p) => p.type === "minute")?.value ?? "--";
  return (
    <span className="time">
      {label} {h}
      <span style={{ opacity: on ? 1 : 0 }}>:</span>
      {m}
    </span>
  );
}

export function Header() {
  return (
    <header>
      <nav className="lp-nav">
        <div className="logo">
          <Link href="/" className="btn">
            Waypoint
          </Link>
        </div>
        <Clock label="DEL(IN)" zone="Asia/Kolkata" blinkOffset={0} />
        <Clock label="SF(US)" zone="America/Los_Angeles" blinkOffset={100} />
        <ul>
          <li>
            <a href="#manifesto" className="btn">
              About
            </a>
          </li>
          <li>
            <a href="#destinations" className="btn">
              Routes
            </a>
          </li>
          <li>
            <Link href="/start" className="btn">
              Start
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

const SPIN = ["\\", "|", "/", "–"];

function Spinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SPIN.length), 160);
    return () => clearInterval(t);
  }, []);
  return <span aria-hidden>{SPIN[i]}</span>;
}

export function FooterBar() {
  return (
    <div className="lp-footerbar">
      <ul>
        <li>
          <a href="https://roadmap.sh" target="_blank" rel="noreferrer" className="btn">
            roadmap.sh
          </a>
        </li>
        <li>
          <a href="#sources" className="btn">
            Sources
          </a>
        </li>
        <li>
          <Link href="/start" className="btn">
            Plot my route
          </Link>
        </li>
        <li>
          <a href="https://2xa.studio" target="_blank" rel="noreferrer" className="btn">
            Design: 2xA
          </a>
        </li>
        <li />
        <li>
          <a href="https://www.youtube.com/watch?v=jfKfPfyJRdk" target="_blank" rel="noreferrer" className="btn">
            Study Sounds <Spinner />
          </a>
        </li>
      </ul>
    </div>
  );
}
