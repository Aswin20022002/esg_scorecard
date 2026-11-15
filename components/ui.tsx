import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion, Users } from "lucide-react";
import type { Evidence, Severity } from "@/lib/types";

export function Pill({ tone, children, icon }: { tone: "ok" | "warn" | "viol" | "bad" | "mute" | "brand"; children: React.ReactNode; icon?: React.ReactNode }) {
  const tones: Record<string, string> = {
    ok: "bg-[#e0f3e9] text-ok",
    warn: "bg-[#fbeed6] text-warn",
    viol: "bg-[#ecEAfb] text-viol",
    bad: "bg-[#f9e3df] text-bad",
    mute: "bg-[#e6ede9] text-mute",
    brand: "bg-tint text-brand-ink",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function EvidencePill({ evidence }: { evidence: Evidence }) {
  switch (evidence) {
    case "verified":
      return <Pill tone="ok" icon={<ShieldCheck size={14} aria-hidden />}>Quote confirmed in PDF</Pill>;
    case "partial":
      return <Pill tone="warn" icon={<ShieldQuestion size={14} aria-hidden />}>Quote partly matched</Pill>;
    case "unverified":
      return <Pill tone="viol" icon={<ShieldAlert size={14} aria-hidden />}>Quote not found in PDF</Pill>;
    default:
      return null;
  }
}

export function SeverityPill({ severity }: { severity: Severity }) {
  if (severity === "high") return <Pill tone="bad" icon={<AlertTriangle size={14} aria-hidden />}>High</Pill>;
  if (severity === "medium") return <Pill tone="warn" icon={<AlertTriangle size={14} aria-hidden />}>Medium</Pill>;
  return <Pill tone="mute" icon={<AlertTriangle size={14} aria-hidden />}>Low</Pill>;
}

export function ModelsPill({ disagree }: { disagree: boolean }) {
  return disagree ? <Pill tone="bad" icon={<Users size={14} aria-hidden />}>Models disagree</Pill> : <Pill tone="ok" icon={<Users size={14} aria-hidden />}>Models agree</Pill>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface shadow-lift ${className}`}>{children}</div>;
}
