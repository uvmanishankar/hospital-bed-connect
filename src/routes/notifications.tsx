import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const items = [
  { t: "ICU-1 nearing capacity", s: "Critical", d: "5 min ago" },
  { t: "Ventilator AST-INF-007 due for maintenance", s: "Warning", d: "20 min ago" },
  { t: "New admission request REQ-BED-1031", s: "Info", d: "1 hr ago" },
  { t: "Bed ICU-2-08 marked occupied", s: "Info", d: "2 hr ago" },
  { t: "SLA breach on bed allocation", s: "Critical", d: "Yesterday" },
];

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HospitalCare" }] }),
  component: () => (
    <AppShell title="Notifications" breadcrumb={["Home", "Notifications"]}>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {items.map((n, i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${n.s === "Critical" ? "bg-destructive" : n.s === "Warning" ? "bg-warning" : "bg-info"}`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-secondary">{n.t}</div>
              <div className="text-xs text-muted-foreground">{n.d}</div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-muted">{n.s}</span>
          </div>
        ))}
      </div>
    </AppShell>
  ),
});
