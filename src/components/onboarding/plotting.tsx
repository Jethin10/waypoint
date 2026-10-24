"use client";
import { useEffect, useState } from "react";
import { RouteSignal } from "./path-art";

export function Plotting({ lines }: { lines: string[] }) {
 const [i,setI] = useState(0);
 useEffect(()=>{const t=setInterval(()=>setI(v=>Math.min(v+1,lines.length-1)),900);return ()=>clearInterval(t);},[lines.length]);
 return <div className="plotting-screen" role="status" aria-live="polite"><p className="step-kicker"><span>04 / 04</span> Your route</p><RouteSignal variant={i} /><h1>Connecting the dots.</h1><p>Your starting point, your time, your next move.</p><ul>{lines.map((line,k)=><li key={line} className={k<=i?"ready":""}><span>{k<i?"\u2713":k===i?"\u25cf":"\u25cb"}</span>{line}</li>)}</ul></div>;
}
