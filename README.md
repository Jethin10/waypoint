# Waypoint — a GPS for learning

Students don't lack roadmaps; they lack a route that knows what they already know, proves they learned it, and recalculates when life happens. Waypoint does that, weighted by what real job postings ask for.

## Run it

```powershell
npm install
copy .env.example .env.local   # optional: add ANTHROPIC_API_KEY for Claude grading + narration
npm run dev                    # http://localhost:3000
```

No key? Everything still works: the offline engine plots routes and grades explanations.

## Demo path (3 minutes)

1. Landing page → **Plot my route** → pick **Machine Learning**.
2. Set 2h/day, 3 months → swipe through calibration (keys 1/2/3 work).
3. On the map, open the blue **You are here** stop → **Prove it**.
4. Type a one-line answer → it fails → **Recalculate my route** → a detour appears.
5. Finish the detour, explain properly → pass → confetti, readiness ticks up.
6. **Life happened · I missed 3 days** → the route replans.

## How it works

- `scripts/build-data.mjs` — pulls roadmap.sh topic graphs + content, and live postings from public Greenhouse/Lever boards, then matches postings to topics. Re-run to refresh `src/data/`.
- `src/lib/engine.ts` — route building, trimming to fit your hours, detours, missed-day replans, job readiness.
- `src/lib/ai.ts` — Claude (`claude-opus-5-5`) for chapter narration and explain-back grading, via structured outputs.
- `src/lib/grader.ts` — offline fallback grader.

## Credits

- Topic graphs, descriptions and curated resources: [roadmap.sh](https://roadmap.sh) (used for a non-commercial hackathon demo).
- Job data: public Greenhouse and Lever job boards (snapshot in `src/data/index.json`).
- Landing page layout, motion system, reel and project media: [2xA Studio](https://2xa.studio). Media is streamed from their site, so the landing page needs internet.

## Deployment

The Next.js app is deployed on Vercel. All routes work without an API key using the local planning and grading engines. To enable Claude narration and grading, add `ANTHROPIC_API_KEY` as a server-side Vercel environment variable and redeploy.

Local `.env` files, Vercel credentials, and downloaded design references are excluded from Git and deployment uploads.
