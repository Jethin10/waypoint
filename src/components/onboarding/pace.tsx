"use client";

import { motion } from "motion/react";

const WEEKS = [{ w: 4, l: "1 month", hint: "A focused sprint" }, { w: 8, l: "2 months", hint: "Build momentum" }, { w: 12, l: "3 months", hint: "Room to explore" }, { w: 24, l: "6 months", hint: "Slow and steady" }];
const DAILY = [{h:.5,label:"Light",hint:"30 minutes"},{h:1,label:"Steady",hint:"1 hour"},{h:2,label:"Focused",hint:"2 hours"}];

export function Pace({ hours, weeks, onHours, onWeeks }: { hours: number; weeks: number; onHours: (h: number) => void; onWeeks: (w: number) => void }) {
  return <div className="pace-screen">
    <div className="destination-intro"><div><p className="step-kicker"><span>02 / 04</span> Pace</p><h1>Make it part<br />of your day.</h1><p className="intro-copy">Consistency over cramming. Choose what fits.</p></div></div>
    <div className="pace-columns">
      <section><h2>How much time each day?</h2><div className="daily-options">{DAILY.map((d,i)=><button key={d.h} className={hours===d.h?"daily-choice selected":"daily-choice"} aria-pressed={hours===d.h} onClick={()=>onHours(d.h)}><span className="daily-spark" aria-hidden="true">{String(i+1).padStart(2,"0")}</span><span><strong>{d.label}</strong><small>{d.hint}</small></span><span className="choice-radio" /></button>)}</div>
      <label className="custom-hours" htmlFor="daily-hours">Or set your own <strong>{hours < 1 ? `${hours*60} min` : `${hours} ${hours === 1 ? "hour" : "hours"}`}/day</strong></label><input id="daily-hours" type="range" min={.5} max={6} step={.5} value={hours} onChange={e=>onHours(Number(e.target.value))} /></section>
      <section><h2>When would you like to get there?</h2><div className="week-options">{WEEKS.map(o=><button key={o.w} className={weeks===o.w?"week-choice selected":"week-choice"} aria-pressed={weeks===o.w} onClick={()=>onWeeks(o.w)}>{weeks === o.w && <motion.span className="choice-highlight" layoutId="selected-week" initial={false} transition={{type:"spring",stiffness:350,damping:32}} />}<strong>{o.l}</strong><span>{o.hint}</span></button>)}</div><div className="pace-promise"><span aria-hidden="true">&#8599;</span><p><strong>{Math.round(hours*weeks*6)} focused hours.</strong><br />Six days a week, with a little room for life. We will adjust your route as you go.</p></div></section>
    </div>
  </div>;
}
