"use client";

import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { useFlyThrough, useProgress } from "./hooks";
import { SectionTitle, Subtitle } from "./section-title";
import { Typer } from "./typer";

export interface Destination {
  slug: string;
  title: string;
  description: string;
  media: { kind: "video" | "image"; src: string; ratio: string };
}

/** Thumbnail revealed through a quadtree-style grid of cells that drop away in random order. */
function Quadtree({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const cells = 8 * 6;
  return (
    <div ref={ref} className="relative h-full w-full">
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-6">
        {Array.from({ length: cells }, (_, i) => {
          const r = Math.abs(Math.sin(i * 91.7)) % 1;
          return (
            <motion.span
              key={i}
              style={{ background: "var(--background)" }}
              initial={{ opacity: 1 }}
              animate={inView ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.01, delay: 0.1 + r * 0.8 }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Item({ d, i }: { d: Destination; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useFlyThrough(ref);
  const cardY = useMotionValue(0);
  const cardYs = useSpring(cardY, { stiffness: 260, damping: 30 });

  return (
    <div className="item" ref={ref}>
      <motion.div className="inner" style={{ y }}>
        <Link
          href={`/start?slug=${d.slug}`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            cardY.set(Math.max(0, Math.min(r.height - 60, e.clientY - r.top - 30)));
          }}
        >
          <p className="num">({String(i + 1).padStart(2, "0")})</p>
          <h3 className="title">
            <Typer text={d.title} />
          </h3>
          <div className="thumb media" style={{ aspectRatio: d.media.ratio }}>
            <Quadtree>
              {d.media.kind === "video" ? (
                <video src={d.media.src} autoPlay muted loop playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.media.src} alt="" loading="lazy" />
              )}
            </Quadtree>
          </div>
          <p className="desc">{d.description}</p>
          <motion.div className="card" style={{ y: cardYs }}>
            <span>
              <Typer text="Plot this route" />
            </span>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}

export function Destinations({ items, total, postings }: { items: Destination[]; total: number; postings: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useProgress(ref);
  return (
    <>
      <div className="lp-projects-intro theme--light" id="destinations" ref={ref}>
        <SectionTitle
            variant="t-projects"
            words={["Selected", "Routes"]}
            progress={progress}
            travel={0.2}
            travelClamped={0.3}
            linkInside={
              <span className="link">
                <Link href="/start" className="btn">
                  View All ({total})
                </Link>
              </span>
            }
          />
        <div className="text">
          <p>
            Waypoint is a learning GPS for students, built on roadmap.sh&apos;s community-curated topics and a live read of {postings.toLocaleString()} job postings. It plots a route to
            a real role, skips what you already know, and fits the rest into the hours you actually have. Every stop carries the share of postings that ask for it, so effort follows
            demand instead of habit.
          </p>
          <p>
            The route follows the learner. Every stop is a set of conditions released into motion: explain it back, get graded, and watch the path bend toward what you still need.
          </p>
        </div>
      </div>
      <div className="lp-projects theme--light">
        <div className="list">
          {items.map((d, i) => (
            <Item key={d.slug} d={d} i={i} />
          ))}
        </div>
        <Subtitle text={`Built On ${postings.toLocaleString()} Real Job Postings`} />
      </div>
    </>
  );
}
