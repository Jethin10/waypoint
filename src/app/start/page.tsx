"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Calibrate, type CalibTopic } from "@/components/onboarding/calibrate";
import { Destination } from "@/components/onboarding/destination";
import { Pace } from "@/components/onboarding/pace";
import { Plotting } from "@/components/onboarding/plotting";
import { SetupRail } from "@/components/onboarding/setup-rail";
import "../learn.css";
import { EASE } from "@/components/ui/motion";
import { toast } from "@/components/ui/toast";
import index from "@/data/index.json";
import type { Familiarity, Plan, Profile, RoadmapMeta } from "@/lib/types";
import { useJourney } from "@/store/journey";

const STEPS = ["Destination", "Pace", "Starting point", "Your route"];
const CALIBRATION_SIZE = 10;

function StartFlow() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const params = useSearchParams();
  const setJourney = useJourney((s) => s.setJourney);
  const roadmaps = index.roadmaps as RoadmapMeta[];

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const go = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next); };
  const [slug, setSlug] = useState<string | null>(params.get("slug"));
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState(2);
  const [weeks, setWeeks] = useState(12);
  const [topics, setTopics] = useState<CalibTopic[] | null>(null);

  const meta = roadmaps.find((r) => r.slug === slug);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetch(`/api/roadmap/${slug}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => setTopics(d.topics))
      .catch((error) => { if (error.name !== "AbortError") toast({ title: "Couldn't load that roadmap", body: "Go back and choose the path again to retry.", tone: "ember" }); });
    return () => controller.abort();
  }, [slug]);

  const plotLines = useMemo(
    () => [
      `Reading ${meta?.nodes ?? ""} topics from roadmap.sh`,
      `Weighing ${meta?.postings ?? ""} live job postings`,
      "Skipping what you already know",
      `Fitting it into ${hours}h a day`,
      "Naming your chapters",
    ],
    [meta, hours],
  );

  const plot = async (ratings: Record<string, Familiarity>) => {
    if (!slug) return;
    setStep(3);
    const profile: Profile = { slug, goal, hoursPerDay: hours, weeks, ratings };
    try {
      const [res] = await Promise.all([
        fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) }),
        new Promise((r) => setTimeout(r, 4200)),
      ]);
      const data = (await res.json()) as { plan?: Plan; warning?: string | null; error?: string };
      if (!res.ok || !data.plan) throw new Error(data.error ?? "Plan failed");
      if (data.warning) toast({ title: "Plotted offline", body: data.warning });
      setJourney(profile, data.plan);
      router.push("/journey");
    } catch (err) {
      toast({ title: "Couldn't plot your route", body: err instanceof Error ? err.message : "Try again in a moment.", tone: "ember" });
      setStep(2);
    }
  };

  const canNext = step === 0 ? Boolean(slug) : true;

  return (
    <div className="wp-app onboarding-app">
      <header className="setup-header">
        <Link href="/" className="learn-brand">Waypoint<span className="brand-plus" aria-hidden="true">+</span></Link>
        <nav aria-label="Setup progress" className="setup-progress">
          <div className="setup-progress-track"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          <ol>{STEPS.map((s, i) => <li key={s} aria-current={i === step ? "step" : undefined} className={i <= step ? "reached" : ""}><span>{i < step ? "\u2713" : i + 1}</span>{s}</li>)}</ol>
        </nav>
        <Link href="/" className="setup-duration">Exit setup &#8599;</Link>
      </header>

      <main className="setup-main">
        <SetupRail step={step} title={meta?.shortTitle} topics={meta?.topics} postings={meta?.postings} hours={hours} weeks={weeks} variant={Math.max(0, roadmaps.findIndex(r => r.slug === slug))} />
        <div className="setup-workspace">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            custom={direction}
            variants={{enter:(d:number)=>({opacity:0,x:reduced?0:d*28}),visible:{opacity:1,x:0},leave:(d:number)=>({opacity:0,x:reduced?0:-d*18})}}
            initial="enter"
            animate="visible"
            exit="leave"
            transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
          >
            {step === 0 && <Destination roadmaps={roadmaps} slug={slug} goal={goal} onSlug={(s) => {
                  if (s !== slug) setTopics(null);
                  setSlug(s);
                }} onGoal={setGoal} />}
            {step === 1 && <Pace hours={hours} weeks={weeks} onHours={setHours} onWeeks={setWeeks} />}
            {step === 2 && <button className="quiet-button calibration-back" onClick={() => go(1)}>Back to your pace</button>}
            {step === 2 &&
              (topics ? (
                <Calibrate topics={topics.slice(0, CALIBRATION_SIZE)} onDone={plot} onSkip={() => plot({})} />
              ) : (
                <div className="shimmer h-[420px] rounded-[0.2rem] bg-ink-2" />
              ))}
            {step === 3 && <Plotting lines={plotLines} />}
          </motion.section>
        </AnimatePresence>
        </div>
      </main>

      {step < 2 && (
        <footer className="setup-footer">
          <div>
            {step > 0 ? <button onClick={() => go(step - 1)} className="quiet-button">Back</button> : <Link href="/" className="quiet-button">Back to home</Link>}
            <p aria-live="polite">{meta ? <><span className="selection-dot" />{meta.shortTitle}<span className="footer-hint">You can change this later.</span></> : "Your next chapter starts with a choice."}</p>
            <button onClick={() => canNext && go(step + 1)} disabled={!canNext} className="play-button">{step === 0 ? "Continue" : "Find my level"}<span aria-hidden="true"> &#8594;</span></button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense>
      <StartFlow />
    </Suspense>
  );
}
