export type ResourceType = "video" | "article" | "course" | "opensource" | "official" | "feed" | "podcast" | "book" | string;

export interface Resource {
  type: ResourceType;
  title: string;
  url: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  resources: Resource[];
}

export interface RoadmapTopic extends RoadmapItem {
  children: RoadmapItem[];
}

export interface Roadmap {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  topics: RoadmapTopic[];
}

export interface Posting {
  company: string;
  title: string;
  location: string;
  url: string;
  skills: string[];
}

export interface JobsData {
  snapshot: string;
  scanned: number;
  postings: Posting[];
  demand: Record<string, number>;
}

export interface RoadmapMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  topics: number;
  nodes: number;
  postings: number;
  companies: number;
}

/** 0 = new to me, 1 = seen it, 2 = I can use it */
export type Familiarity = 0 | 1 | 2;

export interface Profile {
  slug: string;
  goal: string;
  hoursPerDay: number;
  weeks: number;
  ratings: Record<string, Familiarity>;
}

export interface PlanSubtopic {
  refId: string;
  title: string;
  description: string;
  resources: Resource[];
  demand: number;
  skipped: boolean;
  done: boolean;
}

export type NodeKind = "learn" | "review" | "mastered";
export type NodeStatus = "done" | "current" | "upcoming" | "mastered";

export interface PlanNode {
  id: string;
  refId: string;
  kind: NodeKind;
  status: NodeStatus;
  title: string;
  description: string;
  resources: Resource[];
  subtopics: PlanSubtopic[];
  minutes: number;
  day: number;
  demand: number;
  familiarity: Familiarity;
  why?: string;
  focus?: string[];
  score?: number;
  attempts: number;
  chapter: number;
}

export interface Chapter {
  index: number;
  title: string;
  why: string;
}

export interface Plan {
  slug: string;
  roadmapTitle: string;
  headline: string;
  chapters: Chapter[];
  nodes: PlanNode[];
  beyond: { refId: string; title: string; demand: number }[];
  minutesPerDay: number;
  deadlineDay: number;
  totalDays: number;
  trimmedSubtopics: number;
  engine: "claude" | "offline";
}

export interface GradeResult {
  score: number;
  verdict: string;
  feedback: string;
  strengths: string[];
  gaps: string[];
  followUp: string;
  engine: "claude" | "offline";
}
