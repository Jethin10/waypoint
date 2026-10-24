"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { complete, replanAfterMiss, reroute } from "@/lib/engine";
import type { GradeResult, Plan, Profile } from "@/lib/types";

export interface Attempt {
  nodeId: string;
  title: string;
  score: number;
  at: number;
}

interface JourneyState {
  profile: Profile | null;
  plan: Plan | null;
  startedAt: number | null;
  /** Simulated day offset for the "life happened" demo control. */
  dayOffset: number;
  streak: number;
  attempts: Attempt[];
  setJourney: (profile: Profile, plan: Plan) => void;
  today: () => number;
  pass: (nodeId: string, grade: GradeResult) => void;
  fail: (nodeId: string, grade: GradeResult) => void;
  finishDetour: (nodeId: string) => void;
  toggleSubtopic: (nodeId: string, refId: string) => void;
  missDays: (days: number) => ReturnType<typeof replanAfterMiss> | null;
  reset: () => void;
}

const DAY = 86_400_000;

export const useJourney = create<JourneyState>()(
  persist(
    (set, get) => ({
      profile: null,
      plan: null,
      startedAt: null,
      dayOffset: 0,
      streak: 0,
      attempts: [],

      setJourney: (profile, plan) => set({ profile, plan, startedAt: Date.now(), dayOffset: 0, streak: 0, attempts: [] }),

      today: () => {
        const { startedAt, dayOffset } = get();
        if (!startedAt) return 0;
        return Math.floor((Date.now() - startedAt) / DAY) + dayOffset;
      },

      pass: (nodeId, grade) => {
        const { plan, attempts, streak } = get();
        if (!plan) return;
        const node = plan.nodes.find((n) => n.id === nodeId);
        set({
          plan: complete(plan, nodeId, grade.score, get().today()),
          streak: streak + 1,
          attempts: [...attempts, { nodeId, title: node?.title ?? "", score: grade.score, at: Date.now() }],
        });
      },

      fail: (nodeId, grade) => {
        const { plan, attempts } = get();
        if (!plan) return;
        const node = plan.nodes.find((n) => n.id === nodeId);
        set({
          plan: reroute(plan, nodeId, grade.gaps, get().today()),
          attempts: [...attempts, { nodeId, title: node?.title ?? "", score: grade.score, at: Date.now() }],
        });
      },

      finishDetour: (nodeId) => {
        const { plan, streak } = get();
        if (!plan) return;
        set({ plan: complete(plan, nodeId, undefined, get().today()), streak: streak + 1 });
      },

      toggleSubtopic: (nodeId, refId) => {
        const { plan } = get();
        if (!plan) return;
        set({
          plan: {
            ...plan,
            nodes: plan.nodes.map((n) =>
              n.id === nodeId ? { ...n, subtopics: n.subtopics.map((s) => (s.refId === refId ? { ...s, done: !s.done } : s)) } : n,
            ),
          },
        });
      },

      missDays: (days) => {
        const { plan } = get();
        if (!plan) return null;
        const dayOffset = get().dayOffset + days;
        set({ dayOffset });
        const result = replanAfterMiss(plan, get().today());
        set({ plan: result.plan, streak: 0 });
        return result;
      },

      reset: () => set({ profile: null, plan: null, startedAt: null, dayOffset: 0, streak: 0, attempts: [] }),
    }),
    { name: "waypoint-journey", version: 1 },
  ),
);
