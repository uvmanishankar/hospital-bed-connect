import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export function Logo({ variant = "dark", size = "md" }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }) {
  const text = variant === "light" ? "text-white" : "text-secondary";
  const sub = variant === "light" ? "text-primary-glow" : "text-primary";
  const sizes = {
    sm: { box: "h-9 w-9", title: "text-base", sub: "text-[9px]" },
    md: { box: "h-11 w-11", title: "text-lg", sub: "text-[10px]" },
    lg: { box: "h-14 w-14", title: "text-2xl", sub: "text-[11px]" },
  }[size];
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div
        className={`${sizes.box} grid place-items-center rounded-xl shadow-sm shrink-0`}
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-glow))" }}
      >
        <Activity className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${text} ${sizes.title} font-extrabold tracking-tight`}>HOSPITAL CARE</span>
        <span className={`${sub} ${sizes.sub} font-bold tracking-[0.18em] mt-1`}>BED MANAGEMENT SYSTEM</span>
      </div>
    </Link>
  );
}
