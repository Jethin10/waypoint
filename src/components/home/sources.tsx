"use client";

import { useRef } from "react";
import { FooterBar } from "./header";
import { useProgress, useScrollPrint } from "./hooks";
import { Printer } from "./printer";
import { SectionTitle, Subtitle } from "./section-title";

export interface SourceRow {
  signal: string;
  source: string;
  use: string;
  year: string;
  child?: boolean;
}

export function Sources({ rows }: { rows: SourceRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useProgress(ref);
  return (
    <div className="lp-awards" id="sources" ref={ref}>
      <SectionTitle variant="t-awards" words={["Sources", "&", "Signals"]} progress={progress} travel={0.2} travelClamped={0.3} />
      <ul className="head">
        <li className="h">
          <span className="c1">Signal</span>
          <span className="c2">Source</span>
          <span className="c3">What it powers</span>
          <span className="c4">Year</span>
        </li>
      </ul>
      <ul>
        {rows.map((r, i) => (
          <li key={i}>
            <span className="c1">{r.child ? "" : r.signal}</span>
            <span className="c2">{r.source}</span>
            <span className="c3">{r.use}</span>
            <span className="c4">{r.year}</span>
          </li>
        ))}
      </ul>
      <Subtitle text="Good Learning Tends To Get Hired" />
    </div>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollPrint(ref);
  return (
    <footer className="lp-footer theme--dark" ref={ref}>
      <Printer word="WAYPOINT" progress={progress} label="Waypoint" />
      <FooterBar />
    </footer>
  );
}
