import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Waypoint home">
      <span className="relative grid h-7 w-7 place-items-center">
        <span className="absolute inset-0 rounded-full border border-gold/40 transition-transform duration-700 ease-[var(--ease-wp)] group-hover:scale-125" />
        <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_14px_#fdfdfd]" />
      </span>
      <span className="font-serif text-[22px] leading-none tracking-tight text-cream">Waypoint</span>
    </Link>
  );
}
