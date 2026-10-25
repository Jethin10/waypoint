"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Icon, Mascot, Wordmark } from "@/components/app/shell";
import { Explain } from "@/components/journey/explain";
import { NodeSheet } from "@/components/journey/node-sheet";
import { Burst, Recalculating, type RecalcInfo } from "@/components/journey/overlays";
import { RouteMap, unitStyle } from "@/components/journey/route-map";
import { Pace, Quests, Readiness, Stats } from "@/components/journey/sidebar";
import { toast } from "@/components/ui/toast";
import { coveredSkills, nextUnlock, readiness } from "@/lib/engine";
import type { GradeResult, JobsData, PlanNode } from "@/lib/types";
import { useJourney } from "@/store/journey";
import "../app.css";

const useHydrated = () =>
  useSyncExternalStore(
    (cb) => useJourney.persist.onFinishHydration(cb),
    () => useJourney.persist.hasHydrated(),
    () => false,
  );

export default function JourneyPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { plan, profile, startedAt, streak, attempts, today, pass, fail, finishDetour, toggleSubtopic, missDays, reset } = useJourney();
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

  if (!hydrated) return <div className="duo" />;

  if (!plan || !profile || !startedAt) {
    return (
      <main className="duo empty">
        <Mascot mood="think" size={150} />
        <h1>Where are you headed?</h1>
        <p>You don&apos;t have a route yet. It takes about a minute.</p>
        <Link href="/start" className="dbtn primary">
          Plot my route
        </Link>
      </main>
    );
  }

  const day = today();

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
      title: `+30 min detour through ${n.title}`,
      lines: [...(g.gaps.length ? g.gaps.map((x) => `Focus: ${x}`) : ["Focus: the core idea"]), "Then explain it again"].slice(0, 3),
    });
  };

  const onMiss = () => {
    const r = missDays(3);
    if (!r) return;
    setRecalc({
      id: Date.now(),
      title: r.onTrack ? "Still arriving on time" : `Arrival moves ${r.after - r.before} days`,
      lines: [
        r.trimmed ? `Trimmed ${r.trimmed} low-demand subtopics` : "Nothing needed trimming",
        r.trimmedTitles.length ? `e.g. ${r.trimmedTitles.slice(0, 2).join(", ")}` : "Your hours still fit",
        "Streak reset · route rescheduled",
      ],
    });
  };

  const newRoute = () => {
    if (confirm("Start over with a new route? Your progress will be cleared.")) {
      reset();
      router.push("/start");
    }
  };

  const qualified = ready?.qualified ?? 0;
  const next = plan.nodes.find((n) => n.status === "current");
  const doneCount = plan.nodes.filter((n) => n.status === "done" || n.status === "mastered").length;
  const pct = doneCount / plan.nodes.length;
  const tip = unlock ? `Prove ${unlock.node.title} to unlock ${unlock.gain} more ${unlock.gain === 1 ? "role" : "roles"}!` : streak ? `${streak} day streak. Keep it going!` : "One stop a day. You've got this!";
  const nav = (
    <>
      <a href="#top" className="nav-item is-on">
        {Icon.home()}
        <span>Learn</span>
      </a>
      <a href="#readiness" className="nav-item c-purple">
        {Icon.brief()}
        <span>Jobs</span>
      </a>
      <a href="#quests" className="nav-item c-gold">
        {Icon.bolt()}
        <span>Quests</span>
      </a>
      <a href="#pace" className="nav-item" style={{ color: "var(--blue)" }}>
        {Icon.clock()}
        <span>Pace</span>
      </a>
    </>
  );

  return (
    <div className="duo home" id="top">
      <aside className="side-nav">
        <Wordmark />
        {nav}
        <div className="spacer" />
        <button onClick={newRoute} className="nav-item c-red">
          {Icon.plus()}
          <span>New route</span>
        </button>
      </aside>

      <main className="feed">
        <Stats plan={plan} streak={streak} qualified={qualified} className="top-stats" />
        <div className="feed-inner">
          {next && (
            <section className="hero" style={unitStyle(next.chapter)}>
              <div className="hero-copy">
                <small>
                  Up next · Chapter {next.chapter + 1} · Day {day + 1}
                </small>
                <h1>{next.title.replace(/^Detour · /, "")}</h1>
                <div className="pills">
                  <span className="pill">{next.minutes} min</span>
                  {next.demand >= 0.05 && <span className="pill blue">In {Math.round(next.demand * 100)}% of jobs</span>}
                  {unlock?.node.id === next.id && <span className="pill gold">+{unlock.gain} roles</span>}
                </div>
                <button className="dbtn white" onClick={() => setOpen(next)}>
                  {next.kind === "review" ? "Start detour" : `Start lesson +15 XP`}
                </button>
              </div>
              <div className="hero-ring" aria-label={`${Math.round(pct * 100)}% of route complete`}>
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" transform="rotate(-90 60 60)" strokeDasharray={`${Math.max(0.001, pct) * 314} 314`} />
                </svg>
                <span>
                  <b>{Math.round(pct * 100)}%</b>
                  {doneCount}/{plan.nodes.length} stops
                </span>
              </div>
            </section>
          )}
          <RouteMap plan={plan} onOpen={setOpen} tip={tip} />
          {plan.beyond.length > 0 && (
            <div className="beyond">
              <b>Beyond your deadline</b>
              Lowest job demand, so they&apos;re parked for now: {plan.beyond.map((b) => b.title).join(" · ")}
            </div>
          )}
        </div>
      </main>

      <aside className="rail">
        <Stats plan={plan} streak={streak} qualified={qualified} />
        <Readiness jobs={jobs} qualified={qualified} total={ready?.total ?? 0} matches={ready?.matches ?? []} unlock={unlock} onOpen={setOpen} />
        <Quests plan={plan} attempts={attempts} streak={streak} />
        <Pace plan={plan} today={day} startedAt={startedAt} onMiss={onMiss} />
        <p className="rail-legal">
          {ai === null ? "…" : ai ? "Graded by Claude" : "Offline grading engine"} · Topics from roadmap.sh
        </p>
      </aside>

      <nav className="tabbar" aria-label="Sections">
        {nav}
        <button onClick={newRoute} className="nav-item c-red" aria-label="New route">
          {Icon.plus()}
        </button>
      </nav>

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
