"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Bar, Icon, Mascot, Prompt } from "@/components/app/shell";
import type { GradeResult, PlanNode } from "@/lib/types";
import { toast } from "../ui/toast";
import { XP_PER_STOP } from "./route-map";

type Phase = "write" | "grading" | "result" | "complete";
const TARGET_WORDS = 40;

interface SpeechRec {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

function getRecognizer(): SpeechRec | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function Waveform({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!stream || !ref.current) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 128;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const c = ref.current;
    const g = c.getContext("2d")!;
    let raf = 0;
    const draw = () => {
      an.getByteFrequencyData(data);
      g.clearRect(0, 0, c.width, c.height);
      const bars = 24;
      const w = c.width / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
        const h = Math.max(6, v * c.height);
        g.fillStyle = "#f26b1d";
        g.beginPath();
        g.roundRect(i * w + 3, (c.height - h) / 2, w - 6, h, 4);
        g.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ctx.close();
    };
  }, [stream]);
  return <canvas ref={ref} width={260} height={40} className="wave" aria-hidden />;
}

function Count({ to }: { to: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const c = animate(mv, to, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [to, mv]);
  return <motion.span>{text}</motion.span>;
}

export function Explain({
  node,
  onClose,
  onPass,
  onFail,
}: {
  node: PlanNode | null;
  onClose: () => void;
  onPass: (n: PlanNode, g: GradeResult) => void;
  onFail: (n: PlanNode, g: GradeResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("write");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const rec = useRef<SpeechRec | null>(null);
  const base = useRef("");

  const resetThen = (fn: () => void) => {
    setPhase("write");
    setText("");
    setResult(null);
    fn();
  };

  const stopListening = () => {
    rec.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setListening(false);
  };

  useEffect(() => () => stopListening(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = async () => {
    const r = getRecognizer();
    if (!r) {
      toast({ title: "Voice isn't supported here", body: "Use Chrome or Edge for speech, or just type your explanation." });
      return;
    }
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: true }));
    } catch {
      /* waveform is optional */
    }
    base.current = text ? text.trim() + " " : "";
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setText(base.current + s);
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") toast({ title: "Microphone stopped", body: e.error, tone: "ember" });
    };
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  const submit = async () => {
    if (!node) return;
    stopListening();
    setPhase("grading");
    try {
      const [res] = await Promise.all([
        fetch("/api/grade", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: node.title,
            description: node.description.slice(0, 3800),
            subtopics: node.subtopics.filter((s) => !s.skipped).map((s) => s.title).slice(0, 40),
            explanation: text,
          }),
        }),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
      const data = (await res.json()) as { result?: GradeResult; warning?: string | null; error?: string };
      if (!res.ok || !data.result) throw new Error(data.error ?? "Grading failed");
      if (data.warning) toast({ title: "Graded offline", body: data.warning });
      setResult(data.result);
      setPhase("result");
    } catch (err) {
      toast({ title: "Couldn't grade that", body: err instanceof Error ? err.message : "Try again.", tone: "ember" });
      setPhase("write");
    }
  };

  const close = () => resetThen(() => {
    stopListening();
    onClose();
  });

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pass = (result?.score ?? 0) >= 70;
  const title = node?.title.replace(/^Detour · /, "");

  return (
    <AnimatePresence>
      {node && (
        <motion.div className="lesson" role="dialog" aria-label={`Explain ${title}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}>
          <header className="lesson-top">
            <button onClick={close} className="icon-btn" aria-label="Close">
              {Icon.close()}
            </button>
            <Bar value={phase === "result" || phase === "complete" ? 1 : Math.min(1, words / TARGET_WORDS)} />
          </header>

          <main className="lesson-body">
            <Prompt mood={phase === "grading" ? "think" : phase === "result" ? (pass ? "cheer" : "sad") : listening ? "wow" : "happy"}>
              {phase === "grading" ? (
                "Hmm, let me read that carefully…"
              ) : (
                <>
                  Explain <b className="hl">{title}</b> like you&apos;re teaching a friend.
                </>
              )}
            </Prompt>
            <textarea
              className="answer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={phase !== "write"}
              autoFocus
              placeholder="In your own words: what is it, why does it matter, and how does it work? An example helps."
            />
            <div className="answer-tools">
              <div className="mic">
                <button
                  onClick={listening ? stopListening : startListening}
                  disabled={phase !== "write"}
                  className={listening ? "mic-btn live" : "mic-btn"}
                  aria-label={listening ? "Stop recording" : "Explain by voice"}
                >
                  {listening && <motion.span className="pulse" animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />}
                  {listening ? <span style={{ width: 16, height: 16, background: "#fff", borderRadius: 4 }} /> : Icon.mic()}
                </button>
                {listening ? <Waveform stream={stream} /> : <span>Tap to talk</span>}
              </div>
              <span className={words >= TARGET_WORDS ? "words ok" : "words"}>
                {words} / {TARGET_WORDS} words
              </span>
            </div>
          </main>

          <AnimatePresence mode="wait">
            {phase === "result" && result ? (
              <motion.footer key="res" className={pass ? "feedback pass" : "feedback fail"} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 38 }}>
                <div>
                  <div className="fb-head">
                    <span className="fb-badge">{pass ? Icon.check() : Icon.close()}</span>
                    <div>
                      <h2>{pass ? "Nice job!" : "Not quite yet"}</h2>
                      <p className="fb-text">
                        <b>{result.verdict.replace(/[.!]+$/, "")}.</b> {result.feedback}
                      </p>
                    </div>
                    <span className="fb-score">
                      <Count to={result.score} />
                    </span>
                  </div>
                  {(result.strengths.length > 0 || result.gaps.length > 0) && (
                    <div className="fb-pills">
                      {result.strengths.map((s) => (
                        <span key={s} className="pill green">
                          ✓ {s}
                        </span>
                      ))}
                      {result.gaps.map((s) => (
                        <span key={s} className="pill red">
                          ○ {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.followUp && <p className="fb-text">Follow-up: {result.followUp}</p>}
                  <div className="fb-actions">
                    <button onClick={() => setPhase("write")} className="dbtn ghost">
                      Try again
                    </button>
                    {pass ? (
                      <button onClick={() => setPhase("complete")} className="dbtn lime">
                        Continue
                      </button>
                    ) : (
                      <button onClick={() => resetThen(() => onFail(node, result))} className="dbtn red">
                        Recalculate my route
                      </button>
                    )}
                  </div>
                </div>
              </motion.footer>
            ) : phase !== "complete" ? (
              <motion.footer key="idle" className="feedback idle" initial={{ y: 0 }} exit={{ opacity: 0 }}>
                <div className="fb-actions" style={{ flexDirection: "row", alignItems: "center", padding: "1.25rem", minHeight: 100 }}>
                  <button onClick={close} className="dbtn ghost">
                    Not now
                  </button>
                  <button onClick={submit} disabled={words < 3 || phase === "grading"} className="dbtn primary">
                    {phase === "grading" ? "Checking…" : "Check"}
                  </button>
                </div>
              </motion.footer>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "complete" && result && (
              <motion.div className="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Mascot mood="cheer" size={170} />
                <motion.h1 initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}>
                  Stop complete!
                </motion.h1>
                <p>You proved {title}. The route moves on.</p>
                <div className="tiles">
                  {[
                    { label: "Total XP", value: XP_PER_STOP, icon: Icon.bolt(), c: "#e9b949" },
                    { label: "Score", value: result.score, icon: Icon.check(), c: "#86b85a" },
                    { label: "Minutes", value: node.minutes, icon: Icon.clock(), c: "#ff9a5c" },
                  ].map((t, i) => (
                    <motion.div key={t.label} className="tile" style={{ "--tc": t.c } as React.CSSProperties} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 + i * 0.12, type: "spring", stiffness: 400, damping: 24 }}>
                      <small>{t.label}</small>
                      <div>
                        {t.icon}
                        <Count to={t.value} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <footer className="lesson-foot">
                  <div style={{ justifyContent: "flex-end" }}>
                    <button onClick={() => resetThen(() => onPass(node, result))} className="dbtn primary" autoFocus>
                      Continue
                    </button>
                  </div>
                </footer>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
