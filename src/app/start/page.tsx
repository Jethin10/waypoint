"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Bar, Icon } from "@/components/app/shell";
import { Calibrate, type CalibTopic } from "@/components/onboarding/calibrate";
import { Destination } from "@/components/onboarding/destination";
import { Daily, Timeline } from "@/components/onboarding/pace";
import { Plotting } from "@/components/onboarding/plotting";
import { toast } from "@/components/ui/toast";
import index from "@/data/index.json";
import type { Familiarity, Plan, Profile, RoadmapMeta } from "@/lib/types";
import { useJourney } from "@/store/journey";
import "../app.css";

const CALIBRATION_SIZE = 10;
const STEPS = 4; // destination, daily, timeline, calibration (plotting is the payoff)

function StartFlow() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const params = useSearchParams();
  const setJourney = useJourney((s) => s.setJourney);
  const roadmaps = index.roadmaps as RoadmapMeta[];

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };
  const [slug, setSlug] = useState<string | null>(params.get("slug"));
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<number | null>(null);
  const [topics, setTopics] = useState<CalibTopic[] | null>(null);
  const [calib, setCalib] = useState(0);

  const meta = roadmaps.find((r) => r.slug === slug);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetch(`/api/roadmap/${slug}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => setTopics(d.topics))
      .catch((error) => {
        if (error.name !== "AbortError") toast({ title: "Couldn't load that roadmap", body: "Go back and choose the path again to retry.", tone: "ember" });
      });
    return () => controller.abort();
  }, [slug]);

  const h = hours ?? 1;
  const w = weeks ?? 12;
  const plotLines = useMemo(
    () => [
      `Reading ${meta?.nodes ?? ""} topics from roadmap.sh`,
      `Weighing ${meta?.postings ?? ""} live job postings`,
      "Skipping what you already know",
      `Fitting it into ${h < 1 ? `${h * 60} min` : `${h}h`} a day`,
      "Naming your chapters",
    ],
    [meta, h],
  );

  const plot = async (ratings: Record<string, Familiarity>) => {
    if (!slug) return;
    go(4);
    const profile: Profile = { slug, goal, hoursPerDay: h, weeks: w, ratings };
    try {
      const [res] = await Promise.all([
        fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) }),
        new Promise((r) => setTimeout(r, 4600)),
      ]);
      const data = (await res.json()) as { plan?: Plan; warning?: string | null; error?: string };
      if (!res.ok || !data.plan) throw new Error(data.error ?? "Plan failed");
      if (data.warning) toast({ title: "Plotted offline", body: data.warning });
      setJourney(profile, data.plan);
      router.push("/journey");
    } catch (err) {
      toast({ title: "Couldn't plot your route", body: err instanceof Error ? err.message : "Try again in a moment.", tone: "ember" });
      go(3);
    }
  };

  const canNext = step === 0 ? Boolean(slug) : step === 1 ? hours !== null : weeks !== null;
  const progress = step >= 4 ? 1 : (step + (step === 3 ? calib : 0)) / STEPS;

  return (
    <div className="duo">
      {step < 4 && (
        <header className="lesson-top">
          {step === 0 ? (
            <Link href="/" className="icon-btn" aria-label="Exit setup">
              {Icon.close()}
            </Link>
          ) : (
            <button className="icon-btn" onClick={() => go(step - 1)} aria-label="Back">
              {Icon.back()}
            </button>
          )}
          <Bar value={progress} />
        </header>
      )}

      <main className={step === 0 ? "lesson-body wide" : "lesson-body"}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * 60 }),
              visible: { opacity: 1, x: 0 },
              leave: (d: number) => ({ opacity: 0, x: reduced ? 0 : -d * 60 }),
            }}
            initial="enter"
            animate="visible"
            exit="leave"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            {step === 0 && (
              <Destination
                roadmaps={roadmaps}
                slug={slug}
                goal={goal}
                onSlug={(s) => {
                  if (s !== slug) setTopics(null);
                  setSlug(s);
                }}
                onGoal={setGoal}
              />
            )}
            {step === 1 && <Daily hours={hours} onHours={setHours} />}
            {step === 2 && <Timeline hours={h} weeks={weeks} onWeeks={setWeeks} />}
            {step === 3 &&
              (topics ? (
                <Calibrate topics={topics.slice(0, CALIBRATION_SIZE)} onProgress={setCalib} onDone={plot} onSkip={() => plot({})} />
              ) : (
                <div className="loading-dots" aria-label="Loading">
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            {step === 4 && <Plotting lines={plotLines} title={meta?.shortTitle} />}
          </motion.section>
        </AnimatePresence>
      </main>

      {step < 3 && (
        <footer className="lesson-foot">
          <div>
            <span className="foot-note">{step === 0 ? "You can change this later" : step === 1 ? "Consistency beats cramming" : "We recalculate if life happens"}</span>
            <button onClick={() => canNext && go(step + 1)} disabled={!canNext} className="dbtn primary">
              Continue
            </button>
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
