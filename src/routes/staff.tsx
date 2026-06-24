import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatCard } from "@/components/AppShell";
import { UserCheck, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff Availability — HospitalCare" }] }),
  component: () => (
    <AppShell title="Staff Availability" breadcrumb={["Home", "Staff Availability"]}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="On Duty" value={128} icon={UserCheck} tone="success" />
        <StatCard label="Off Duty" value={42} icon={Users} tone="info" />
        <StatCard label="On Leave" value={6} icon={Clock} tone="warning" />
        <StatCard label="Total" value={176} icon={Users} tone="primary" />
      </div>
      <div className="mt-6 bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-secondary mb-4">Today's Shift</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { n: "Dr. Priya Sharma", r: "Ward Manager", w: "ICU - 1" },
            { n: "Nurse Anita Roy", r: "Nurse", w: "General Ward" },
            { n: "Dr. Amit Verma", r: "Doctor", w: "ICU - 2" },
            { n: "Nurse Priya Nair", r: "Head Nurse", w: "Pediatrics" },
            { n: "Dr. Rohit Mehta", r: "Doctor", w: "Emergency" },
            { n: "Nurse Suresh", r: "Nurse", w: "ICU - 3" },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white text-xs font-bold">{s.n.split(" ").map(p => p[0]).slice(0, 2).join("")}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{s.n}</div>
                <div className="text-[11px] text-muted-foreground">{s.r} · {s.w}</div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  ),
});
