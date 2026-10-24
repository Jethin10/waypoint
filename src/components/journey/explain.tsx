"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { GradeResult, PlanNode } from "@/lib/types";
import { EASE } from "../ui/motion";
import { toast } from "../ui/toast";

type Phase = "write" | "grading" | "result";

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
      const bars = 40;
      const w = c.width / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
        const h = Math.max(3, v * c.height);
        g.fillStyle = "#0000ff";
        g.fillRect(i * w + 2, (c.height - h) / 2, w - 4, h);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ctx.close();
    };
  }, [stream]);
  return <canvas ref={ref} width={480} height={48} className="h-12 w-full max-w-[480px]" aria-hidden />;
}

function ScoreRing({ score }: { score: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  const dash = useTransform(mv, (v) => `${(v / 100) * 302} 302`);
  useEffect(() => {
    const c = animate(mv, score, { duration: 1.6, ease: EASE });
    return () => c.stop();
  }, [score, mv]);
  const pass = score >= 70;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r="48" fill="none" stroke="#e2e2de" strokeWidth="6" />
        <motion.circle cx="55" cy="55" r="48" fill="none" stroke={pass ? "#0000ff" : "#c34d37"} strokeWidth="6" strokeLinecap="round" style={{ strokeDasharray: dash }} />
      </svg>
      <motion.span className="absolute inset-0 grid place-items-center text-5xl tracking-tight">{text}</motion.span>
    </div>
  );
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
        new Promise((r) => setTimeout(r, 1400)),
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

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pass = (result?.score ?? 0) >= 70;

  return (
    <AnimatePresence>
      {node && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-label={`Explain ${node.title}`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.38, ease: EASE }}
            className="relative w-full max-w-3xl rounded-[0.2rem] border border-line-strong bg-ink-2 p-6 md:p-10"
          >
            <button onClick={() => resetThen(() => { stopListening(); onClose(); })} className="absolute right-4 top-4 rounded-[0.15rem] px-2 py-1 font-mono text-sm uppercase text-muted hover:bg-cream hover:text-ink">
              Esc ✕
            </button>

            <AnimatePresence mode="wait">
              {phase !== "result" ? (
                <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: EASE }}>
                  <p className="label">Explain-back · Feynman check</p>
                  <h2 className="mt-4 text-4xl leading-[0.95] tracking-[-0.02em] md:text-5xl">
                    Explain <span className="underline decoration-blue decoration-4 underline-offset-8">{node.title}</span> like you&apos;re teaching a friend.
                  </h2>
                  <div className="relative mt-8">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={phase === "grading"}
                      autoFocus
                      rows={7}
                      placeholder="In your own words: what is it, why does it matter, and how does it work? An example helps."
                      className="w-full resize-none rounded-[0.15rem] border border-line-strong bg-ink p-5 text-[17px] leading-relaxed text-cream placeholder:text-faint focus:border-cream focus:outline-none"
                    />
                    {phase === "grading" && <div className="shimmer pointer-events-none absolute inset-0 rounded-[0.15rem]" />}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={listening ? stopListening : startListening}
                        disabled={phase === "grading"}
                        className={`relative grid h-14 w-14 place-items-center rounded-full border transition-colors duration-300 ${listening ? "border-ember bg-ember text-cream" : "border-line-strong hover:bg-cream hover:text-ink"}`}
                        aria-label={listening ? "Stop recording" : "Explain by voice"}
                      >
                        {listening && <motion.span className="absolute inset-0 rounded-full border-2 border-ember" animate={{ scale: [1, 1.6], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
                        <span className="font-mono text-lg">{listening ? "■" : "●"}</span>
                      </button>
                      {listening ? <Waveform stream={stream} /> : <span className="font-mono text-xs uppercase text-faint">Speak or type</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-xs uppercase ${words >= 40 ? "text-cream" : "text-faint"}`}>{words} words · aim for 40+</span>
                      <button
                        onClick={submit}
                        disabled={words < 3 || phase === "grading"}
                        className="rounded-[0.15rem] bg-cream px-6 py-3.5 font-mono text-sm uppercase text-ink transition-colors hover:bg-blue hover:text-cream disabled:opacity-30"
                      >
                        {phase === "grading" ? "Reading your explanation…" : "Check my understanding →"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                result && (
                  <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
                    <p className="label">
                      {node.title} · graded by {result.engine === "claude" ? "Claude" : "offline engine"}
                    </p>
                    <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-center">
                      <ScoreRing score={result.score} />
                      <div className="flex-1">
                        <h2 className="text-4xl leading-[0.95] tracking-[-0.02em] md:text-5xl">{result.verdict}</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted">{result.feedback}</p>
                      </div>
                    </div>
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="label mb-3">You nailed</p>
                        <div className="flex flex-wrap gap-2">
                          {result.strengths.length ? (
                            result.strengths.map((s, i) => (
                              <motion.span key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }} className="rounded-[0.15rem] bg-cream px-2 py-1 font-mono text-xs uppercase text-ink">
                                ✓ {s}
                              </motion.span>
                            ))
                          ) : (
                            <span className="font-mono text-xs uppercase text-faint">Nothing specific yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="label mb-3">You missed</p>
                        <div className="flex flex-wrap gap-2">
                          {result.gaps.length ? (
                            result.gaps.map((s, i) => (
                              <motion.span key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }} className="rounded-[0.15rem] border border-ember px-2 py-1 font-mono text-xs uppercase text-ember">
                                ○ {s}
                              </motion.span>
                            ))
                          ) : (
                            <span className="font-mono text-xs uppercase text-faint">No gaps found</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-8 border-l-2 border-blue pl-4 text-[15px] italic text-cream/80">Follow-up: {result.followUp}</p>
                    <div className="mt-8 flex flex-wrap justify-end gap-3">
                      <button onClick={() => setPhase("write")} className="rounded-[0.15rem] border border-line-strong px-5 py-3.5 font-mono text-sm uppercase hover:bg-cream hover:text-ink">
                        Try again
                      </button>
                      {pass ? (
                        <button onClick={() => resetThen(() => onPass(node, result))} className="rounded-[0.15rem] bg-cream px-6 py-3.5 font-mono text-sm uppercase text-ink hover:bg-blue hover:text-cream">
                          Continue the route →
                        </button>
                      ) : (
                        <button onClick={() => resetThen(() => onFail(node, result))} className="rounded-[0.15rem] bg-ember px-6 py-3.5 font-mono text-sm uppercase text-cream hover:bg-cream hover:text-ink">
                          Recalculate my route →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
