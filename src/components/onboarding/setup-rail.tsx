"use client";

import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { Printer } from "@/components/home/printer";
import { RouteSignal } from "./path-art";

const TITLES = [<>A direction.<br />Then a route.</>, <>Your time.<br />Well spent.</>, <>Start where<br />you are.</>, <>The next move<br />is yours.</>];

export function SetupRail({ step, title, topics, postings, hours, weeks, variant }: {
  step: number; title?: string; topics?: number; postings?: number; hours: number; weeks: number; variant: number;
}) {
  const printed = useMotionValue(1);
  return <aside className="setup-rail">
    <div className="rail-heading"><span className="rail-caption">Build a career. One stop at a time.</span><AnimatePresence mode="wait" initial={false}><motion.h2 key={step} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.23}}>{TITLES[step]}</motion.h2></AnimatePresence><p>A learning route shaped by real jobs,<br />your starting point, and your everyday life.</p></div>
    <div className="rail-route">
      <div className="rail-route-label"><span>Your route preview</span><span className="live-indicator">{title ? "Destination set" : "Finding your direction"}</span></div>
      <RouteSignal variant={variant} />
      <div className="rail-route-name"><span className="route-origin" /><AnimatePresence mode="wait" initial={false}><motion.strong key={title ?? "unset"} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>{title ?? "Start with a destination"}</motion.strong></AnimatePresence></div>
      <div className="rail-details"><div><span>{step === 0 ? "Learning stops" : "Daily commitment"}</span><strong>{step === 0 ? topics ?? "--" : hours < 1 ? `${hours * 60} min` : `${hours} ${hours === 1 ? "hour" : "hours"}`}</strong></div><div><span>{step === 0 ? "Matching roles" : "Your timeline"}</span><strong>{step === 0 ? postings ?? "--" : `${weeks} weeks`}</strong></div></div>
    </div>
    <div className="rail-signature"><Printer word="WAYPOINT" progress={printed} label="Waypoint" /><p>Less collecting. More becoming.<span>&copy; {new Date().getFullYear()}</span></p></div>
  </aside>;
}
