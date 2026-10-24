"use client";

import { motion } from "motion/react";

export function WaypointMark() {
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 5h22M3 11h15M10 17h15M3 23h22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>;
}

export function RouteSignal({ variant = 0 }: { variant?: number }) {
  const paths = [
    "M20 120C80 120 40 40 110 40S160 120 220 100S230 20 285 20",
    "M20 110C80 110 45 30 100 30S160 130 200 80S250 80 285 30",
    "M20 120C100 120 40 60 110 60S180 30 210 70S245 100 285 20",
  ];
  return <svg className="route-signal" viewBox="0 0 310 150" fill="none" aria-hidden="true">
    <path d="M0 30H310M0 75H310M0 120H310M30 0V150M110 0V150M190 0V150M270 0V150" stroke="currentColor" opacity=".08" />
    <motion.path d={paths[variant % paths.length]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" animate={{ d: paths[variant % paths.length] }} transition={{ type: "spring", stiffness: 80, damping: 18 }} />
    <circle cx="20" cy="120" r="5" fill="var(--app-paper, #fafaf8)" stroke="currentColor" strokeWidth="2" />
    <motion.circle cx="285" cy="20" r="7" fill="#0000ff" animate={{cy:variant%3===1?30:20}} transition={{type:"spring",stiffness:130,damping:18}} />
    <motion.circle cx="285" cy="20" r="14" stroke="#0000ff" opacity=".18" animate={{cy:variant%3===1?30:20}} transition={{type:"spring",stiffness:130,damping:18}} />
  </svg>;
}

export function PathArt({ slug }: { slug: string }) {
  return <svg viewBox="0 0 220 130" fill="none" aria-hidden="true">
    {slug === "frontend" && <><rect x="46" y="21" width="119" height="78" rx="3" fill="#d6d6d3" /><rect x="55" y="30" width="119" height="78" rx="3" fill="#fafaf8" stroke="currentColor" /><path d="M55 47h119M68 39h2m5 0h2m5 0h2" stroke="currentColor"/><rect x="66" y="58" width="33" height="37" fill="#0000ff"/><path d="M110 59h50M110 68h50M110 77h30M110 94h50" stroke="currentColor" strokeWidth="2"/></>}
    {slug === "backend" && <>{[31,53,75].map((y,i)=><g key={y}><path d={`M66 ${y}v18c0 15 90 15 90 0V${y}`} fill={i===2?"#0000ff":"#e4e4e0"} stroke={i===2?"#0000ff":"currentColor"}/><ellipse cx="111" cy={y} rx="45" ry="11" fill="#fafaf8" stroke="currentColor"/></g>)}</>}
    {slug === "full-stack" && <>{[83,62,41].map((y,i)=><path key={y} d={`m110 ${y-24} 62 27-62 27-62-27Z`} fill={i===2?"#0000ff":"#e4e4e0"} stroke={i===2?"#0000ff":"currentColor"}/>)}</>}
    {slug === "machine-learning" && <><path d="m55 35 55 30 55-30M55 95l55-30 55 30M55 35v60m110-60v60M110 25v80" stroke="currentColor" />{[[55,35],[110,65],[165,35],[55,95],[165,95],[110,25],[110,105]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===1?13:6} fill={i===1?"#0000ff":"#fafaf8"} stroke={i===1?"#0000ff":"currentColor"}/>)}</>}
    {slug === "ai-engineer" && <><circle cx="110" cy="65" r="48" stroke="currentColor" opacity=".22"/><circle cx="110" cy="65" r="34" stroke="currentColor" opacity=".4"/><path d="m110 19 10 34 35 12-35 12-10 34-10-34-35-12 35-12Z" fill="#0000ff"/><circle cx="110" cy="65" r="7" fill="#fafaf8"/></>}
    {slug === "data-analyst" && <><path d="M52 27v76h121M65 50h108M65 77h108" stroke="currentColor" opacity=".25"/>{[38,59,83,46,69,92,57,79,103,67,87].map((h,i)=><path key={i} d={`M${66+i*9} 96V${120-h}`} stroke={i>7?"#0000ff":"currentColor"} strokeWidth="4"/>)}<path d="m58 83 34-28 28 10 44-42" stroke="#0000ff" strokeWidth="2"/></>}
    {slug === "devops" && <><path d="M110 65C42-25 15 133 84 98c21-11 31-45 55-63 55-43 70 83 13 64-15-5-28-24-42-34Z" stroke="#d6d6d3" strokeWidth="20"/><path d="M110 65C42-25 15 133 84 98c21-11 31-45 55-63 55-43 70 83 13 64-15-5-28-24-42-34Z" stroke="currentColor" strokeWidth="1"/><path d="m141 34 10-4-1 11" stroke="#0000ff" strokeWidth="4" strokeLinecap="round"/></>}
    {slug === "cyber-security" && <><path d="m110 14 48 19v31c0 27-25 43-48 52-23-9-48-25-48-52V33Z" fill="#e5e5e1" stroke="currentColor"/><path d="m110 27 35 14v23c0 19-17 33-35 40-18-7-35-21-35-40V41Z" stroke="currentColor"/><rect x="96" y="57" width="28" height="24" rx="2" fill="#0000ff"/><path d="M102 57v-8a8 8 0 0 1 16 0v8" stroke="#0000ff" strokeWidth="3"/><circle cx="110" cy="68" r="2" fill="white"/></>}
  </svg>;
}
