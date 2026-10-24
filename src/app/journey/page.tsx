"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Explain } from "@/components/journey/explain";
import { NodeSheet } from "@/components/journey/node-sheet";
import { Burst, Recalculating, type RecalcInfo } from "@/components/journey/overlays";
import { RouteMap } from "@/components/journey/route-map";
import { Pace, Readiness, Today } from "@/components/journey/sidebar";
import { EASE } from "@/components/ui/motion";
import { toast } from "@/components/ui/toast";
import { coveredSkills, nextUnlock, readiness } from "@/lib/engine";
import type { GradeResult, JobsData, PlanNode } from "@/lib/types";
import { useJourney } from "@/store/journey";

import { WaypointMark } from "@/components/onboarding/path-art";
import "../learn.css";

const useHydrated = () =>
  useSyncExternalStore(
    (cb) => useJourney.persist.onFinishHydration(cb),
    () => useJourney.persist.hasHydrated(),
    () => false,
  );

export default function JourneyPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { plan, profile, startedAt, streak, today, pass, fail, finishDetour, toggleSubtopic, missDays, reset } = useJourney();
  const [jobs, setJobs] = useState<JobsData | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const [open, setOpen] = useState<PlanNode | null>(null);
  const [explaining, setExplaining] = useState<PlanNode | null>(null);
  const [recalc, setRecalc] = useState<RecalcInfo | null>(null);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!plan) return;
    fetch(`/api/jobs/${plan.slug}`)
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => toast({ title: "Job data didn't load", body: "Readiness will appear once the server responds.", tone: "ember" }));
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAi(d.ai))
      .catch(() => setAi(false));
  }, [plan?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = useMemo(() => (plan ? readiness(jobs, coveredSkills(plan)) : null), [plan, jobs]);
  const unlock = useMemo(() => (plan ? nextUnlock(plan, jobs) : null), [plan, jobs]);

  if (!hydrated) return <div className="wp-app min-h-dvh" />;

  if (!plan || !profile || !startedAt) {
    return (
      <main className="wp-app flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
        <p className="label">No route yet</p>
        <h1 className="text-6xl leading-[0.95] tracking-[-0.02em] md:text-8xl">Where are you headed?</h1>
        <Link href="/start" className="rounded-[0.15rem] bg-cream px-6 py-3.5 font-mono text-sm uppercase text-ink hover:bg-blue hover:text-cream">
          Plot my route →
        </Link>
      </main>
    );
  }

  const day = today();
  const nextLesson = plan.nodes.find(n => n.status === "current");
  const completed = plan.nodes.filter(n => n.status === "done" || n.status === "mastered").length;

  const onPass = (n: PlanNode, g: GradeResult) => {
    const before = ready?.qualified ?? 0;
    pass(n.id, g);
    setExplaining(null);
    setOpen(null);
    setBurst((b) => b + 1);
    const after = readiness(jobs, coveredSkills(useJourney.getState().plan!)).qualified;
    toast({
      title: `${n.title} proved · ${g.score}`,
      body: after > before ? `+${after - before} real roles now within reach.` : "On to the next stop.",
      tone: "gold",
    });
  };

  const onFail = (n: PlanNode, g: GradeResult) => {
    fail(n.id, g);
    setExplaining(null);
    setOpen(null);
    setRecalc({
      id: Date.now(),
      title: `+30 min detour through ${n.title}.`,
      lines: [...(g.gaps.length ? g.gaps.map((x) => `Focus: ${x}`) : ["Focus: the core idea"]), "Then explain it again"].slice(0, 3),
    });
  };

  const onMiss = () => {
    const r = missDays(3);
    if (!r) return;
    setRecalc({
      id: Date.now(),
      title: r.onTrack ? "Still arriving on time." : `Arrival moves ${r.after - r.before} days.`,
      lines: [
        r.trimmed ? `Trimmed ${r.trimmed} low-demand subtopics` : "Nothing needed trimming",
        r.trimmedTitles.length ? `e.g. ${r.trimmedTitles.slice(0, 2).join(", ")}` : "Your hours still fit",
        "Streak reset · route rescheduled",
      ],
    });
  };

  return (
    <div className="wp-app journey-app">
      <header className="fixed inset-x-0 top-0 z-40 grid grid-cols-12 items-center gap-2.5 p-4 font-mono text-[1.2rem] uppercase mix-blend-difference md:text-[1.4rem]">
        <Link href="/" className="col-span-4 md:col-span-2">
          Waypoint
        </Link>
        <span className="col-span-4 hidden truncate md:col-span-4 md:block">{plan.roadmapTitle}</span>
        <span className="hidden md:col-span-2 md:block">Day {String(day + 1).padStart(3, "0")}</span>
        <span className="streak-counter hidden md:col-span-2 md:block">{streak} day streak</span>
        <div className="col-span-8 flex justify-end gap-4 md:col-span-2">
          <button
            onClick={() => {
              if (confirm("Start over with a new route? Your progress will be cleared.")) {
                reset();
                router.push("/start");
              }
            }}
            className="uppercase hover:underline"
          >
            New route
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-24 pt-28 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
            <p className="label flex items-center gap-3">
              Your route
              <span className={`rounded-[0.15rem] px-1.5 py-0.5 text-[10px] ${ai ? "bg-blue text-cream" : "border border-line-strong text-muted"}`}>
                {ai === null ? "…" : ai ? "Claude on" : "Offline engine"}
              </span>
            </p>
            <h1 className="mt-4 text-[clamp(2.8rem,7vw,7rem)] leading-[0.9] tracking-[-0.03em]">{plan.roadmapTitle}</h1>
            <p className="mt-4 max-w-2xl font-mono text-sm uppercase leading-relaxed text-muted">
              {plan.headline ||
                `${plan.nodes.filter((n) => n.status === "mastered").length} stops skipped because you know them · ${plan.nodes.filter((n) => n.kind === "learn").length} to go · ${Math.round(plan.minutesPerDay / 6) / 10}h a day`}
            </p>
            {profile.goal && <p className="mt-2 max-w-2xl text-[15px] text-cream/80">“{profile.goal}”</p>}
          </motion.div>
          <div className="journey-guide"><span className="guide-mark"><WaypointMark /></span><div><strong>{nextLesson ? "Pick up where you left off." : "Every stop, completed."}</strong><p>{completed} of {plan.nodes.length} stops complete. {nextLesson ? `Up next: ${nextLesson.title}.` : "Your route is complete."}</p></div>{nextLesson && <button className="play-button" onClick={() => setOpen(nextLesson)}>Start learning</button>}</div>
          <div className="mt-6">
            <RouteMap plan={plan} onOpen={setOpen} />
          </div>
          {plan.beyond.length > 0 && (
            <div className="mt-6 rounded-[0.2rem] border border-dashed border-line-strong p-5">
              <p className="label">Beyond your deadline · lowest job demand</p>
              <p className="mt-3 text-[15px] text-muted">{plan.beyond.map((b) => b.title).join(" · ")}</p>
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <Today plan={plan} today={day} onOpen={setOpen} />
          <Readiness jobs={jobs} qualified={ready?.qualified ?? 0} total={ready?.total ?? 0} matches={ready?.matches ?? []} unlock={unlock} onOpen={setOpen} />
          <Pace plan={plan} today={day} startedAt={startedAt} onMiss={onMiss} />
        </aside>
      </main>

      <NodeSheet
        node={open}
        plan={plan}
        postings={jobs?.postings.length ?? 0}
        onClose={() => setOpen(null)}
        onProve={(n) => setExplaining(n)}
        onFinishDetour={(n) => {
          finishDetour(n.id);
          setOpen(null);
          setBurst((b) => b + 1);
          toast({ title: "Detour done", body: "Back on route. Explain it again when you're ready.", tone: "gold" });
        }}
        onToggle={(n, ref) => toggleSubtopic(n.id, ref)}
      />
      <Explain node={explaining} onClose={() => setExplaining(null)} onPass={onPass} onFail={onFail} />
      <Recalculating info={recalc} onDone={() => setRecalc(null)} />
      <Burst id={burst} />
    </div>
  );
}
