import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const tasks = [
  { t: "Review pending admissions", due: "Today" },
  { t: "Approve ventilator request REQ-AST-1056", due: "Today" },
  { t: "Confirm shift handover with Dr. Verma", due: "Tomorrow" },
  { t: "Audit ICU-2 equipment", due: "This week" },
];

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "My Tasks — HospitalCare" }] }),
  component: () => (
    <AppShell title="My Tasks" breadcrumb={["Home", "My Tasks"]}>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        {tasks.map((t, i) => (
          <label key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40">
            <input type="checkbox" className="h-4 w-4 accent-primary" />
            <span className="flex-1">{t.t}</span>
            <span className="text-xs text-muted-foreground">{t.due}</span>
          </label>
        ))}
      </div>
    </AppShell>
  ),
});
