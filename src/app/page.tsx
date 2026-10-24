import { Destinations, type Destination } from "@/components/home/destinations";
import { Experiments } from "@/components/home/experiments";
import { FooterBar, Header } from "@/components/home/header";
import { Hero } from "@/components/home/hero";
import { Manifesto } from "@/components/home/manifesto";
import { Footer, Sources, type SourceRow } from "@/components/home/sources";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { datasetIndex, getJobs, topSkills } from "@/lib/data";
import "./landing.css";

// Landing layout, motion system and media after 2xA Studio (https://2xa.studio), credited in the footer.
const MEDIA: Destination["media"][] = [
  { kind: "video", src: "https://2xa.studio/media/pages/projects/abr-festival/d8acd0f47c-1777545607/2xa_studio_abr_festival_monitor.mp4", ratio: "16 / 9" },
  { kind: "image", src: "https://2xa.studio/media/pages/projects/buna-tetu/f1d7c01224-1775473644/2xa_buna_tetu_posters_hanging-1331x.jpg", ratio: "1331 / 2000" },
  { kind: "image", src: "https://2xa.studio/media/pages/projects/miao-world/47a7f4c5d2-1775477376/2xa_studio_miao_typography-1920x.jpg", ratio: "16 / 9" },
];

const FEATURED = ["machine-learning", "ai-engineer", "frontend"];

export default function Home() {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const items: Destination[] = FEATURED.map((slug, i) => {
    const meta = datasetIndex.roadmaps.find((r) => r.slug === slug)!;
    const skills = topSkills(slug, 3);
    return {
      slug,
      title: meta.title,
      media: MEDIA[i],
      description: `${meta.topics} stops and ${meta.nodes} topics from roadmap.sh, weighted by ${meta.postings} live postings across ${meta.companies} companies. ${skills
        .map((s) => `${s.title} appears in ${pct(s.share)}`)
        .join(", ")} of them, so that is where your route spends its hours. Everything you already know is skipped.`,
    };
  });

  const postings = datasetIndex.totalPostings;
  const topics = datasetIndex.roadmaps.reduce((a, r) => a + r.nodes, 0);
  const matched = datasetIndex.roadmaps.reduce((a, r) => a + (getJobs(r.slug)?.postings.length ?? 0), 0);
  const year = datasetIndex.snapshot.slice(0, 4);
  const rows: SourceRow[] = [
    { signal: "Topic graph", source: "roadmap.sh", use: `${topics.toLocaleString()} topics, community-ordered`, year },
    { signal: "Topic graph", source: "roadmap.sh", use: "Curated articles, docs & videos", year, child: true },
    { signal: "Topic graph", source: "roadmap.sh", use: `${datasetIndex.roadmaps.length} destinations`, year, child: true },
    { signal: "Job demand", source: "Greenhouse", use: `${postings.toLocaleString()} live postings read`, year },
    { signal: "Job demand", source: "Lever", use: `${matched.toLocaleString()} matched to skills`, year, child: true },
    { signal: "Job demand", source: "Waypoint matcher", use: `${datasetIndex.companies} companies, dated snapshot`, year, child: true },
    { signal: "Understanding", source: "Claude Opus 5.5", use: "Explain-back grading", year },
    { signal: "Understanding", source: "Claude Opus 5.5", use: "Chapter names & route narration", year, child: true },
    { signal: "Rerouting", source: "Waypoint engine", use: "Detours after a missed concept", year },
    { signal: "Rerouting", source: "Waypoint engine", use: "Missed-day replans & trimming", year, child: true },
    { signal: "Rerouting", source: "Waypoint engine", use: "Offline fallback, no key needed", year, child: true },
    { signal: "Design", source: "2xA Studio", use: "Landing layout, motion & media (credited)", year },
  ];

  return (
    <div className="lp theme--dark">
      <SmoothScroll />
      <Header />
      <main>
        <div className="welcome">
          <Hero />
          <Experiments />
          <FooterBar />
        </div>
        <Manifesto />
        <Destinations items={items} total={datasetIndex.roadmaps.length} postings={postings} />
        <Sources rows={rows} />
        <Footer />
      </main>
      <div className="noise" aria-hidden />
    </div>
  );
}
