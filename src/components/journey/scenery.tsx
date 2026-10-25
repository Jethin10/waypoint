/* Roadside props for the route. Warm map greys with a touch of the chapter colour (var(--u)). */

const BASE = "#1e1e19";
const MID = "#2a2a23";
const HI = "#3a3a30";

function Pines() {
  return (
    <svg viewBox="0 0 110 100" width="110" height="100">
      <ellipse cx="55" cy="94" rx="48" ry="5" fill="#000" opacity=".3" />
      <path d="M30 18 8 70h44L30 18Z" fill={MID} />
      <path d="M30 18 30 70h22L30 18Z" fill={HI} />
      <rect x="27" y="70" width="6" height="22" rx="2" fill={BASE} />
      <path d="M72 6 46 66h52L72 6Z" fill={MID} />
      <path d="M72 6v60h26L72 6Z" fill={HI} />
      <rect x="69" y="66" width="6" height="26" rx="2" fill={BASE} />
    </svg>
  );
}

function Peaks() {
  return (
    <svg viewBox="0 0 150 100" width="150" height="100">
      <path d="M0 96 52 20l30 44 18-22 50 54H0Z" fill={BASE} />
      <path d="M52 20 82 64 70 96H52V20Z" fill={MID} />
      <path d="M52 20 40 38l8 4 6-6 8 6 6-4L52 20Z" fill="#ffe6cc" opacity=".85" />
      <path d="M100 42 90 54l6 2 4-4 5 4 5-3-10-11Z" fill="#ffe6cc" opacity=".6" />
    </svg>
  );
}

function Signpost() {
  return (
    <svg viewBox="0 0 90 100" width="90" height="100">
      <ellipse cx="45" cy="95" rx="26" ry="4" fill="#000" opacity=".3" />
      <rect x="41" y="20" width="8" height="74" rx="3" fill={HI} />
      <path d="M14 26h50l12 10-12 10H14a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4Z" fill="var(--u)" opacity=".85" />
      <path d="M22 36h34" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" />
      <path d="M76 54H26l-12 9 12 9h50a4 4 0 0 0 4-4V58a4 4 0 0 0-4-4Z" fill={MID} />
      <path d="M34 63h34" stroke={HI} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      <ellipse cx="30" cy="95" rx="22" ry="4" fill="#000" opacity=".3" />
      <rect x="26" y="8" width="6" height="86" rx="3" fill={HI} />
      <path d="M32 12c14-6 22 6 40 0v30c-18 6-26-6-40 0V12Z" fill="var(--u)" />
      <path d="M32 12c14-6 22 6 40 0v8c-18 6-26-6-40 0v-8Z" fill="#fff" opacity=".2" />
      <circle cx="29" cy="8" r="5" fill="#e9b949" />
    </svg>
  );
}

function Rocks() {
  return (
    <svg viewBox="0 0 110 60" width="110" height="60">
      <ellipse cx="55" cy="54" rx="48" ry="5" fill="#000" opacity=".3" />
      <path d="M10 52c0-14 10-26 26-26s24 10 24 26H10Z" fill={MID} />
      <path d="M22 34c6-6 18-8 26 0" stroke={HI} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M54 52c0-10 8-18 20-18s22 8 22 18H54Z" fill={BASE} />
      <circle cx="88" cy="22" r="4" fill="#e9b949" opacity=".9" />
      <path d="M88 10v6M88 28v6M76 22h6M94 22h6" stroke="#e9b949" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function Cloud() {
  return (
    <svg viewBox="0 0 120 60" width="120" height="60">
      <path d="M26 50a18 18 0 0 1 2-36 26 26 0 0 1 48-4 20 20 0 0 1 22 26 14 14 0 0 1-6 14H26Z" fill={MID} opacity=".7" />
    </svg>
  );
}

function Lamp() {
  return (
    <svg viewBox="0 0 70 110" width="70" height="110">
      <ellipse cx="35" cy="105" rx="20" ry="4" fill="#000" opacity=".3" />
      <circle cx="35" cy="18" r="22" fill="var(--u)" opacity=".12" />
      <rect x="32" y="22" width="6" height="82" rx="3" fill={HI} />
      <path d="M22 12h26l-4 14H26l-4-14Z" fill={MID} />
      <rect x="27" y="14" width="16" height="8" rx="2" fill="#e9b949" />
    </svg>
  );
}

export const PROPS = [Pines, Signpost, Peaks, Flag, Rocks, Lamp, Cloud, Pines, Rocks];
