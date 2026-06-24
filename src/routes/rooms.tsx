import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "Rooms & Wards — HospitalCare" }] }),
  component: () => (
    <AppShell title="Rooms & Wards" breadcrumb={["Home", "Rooms & Wards"]}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { ward: "ICU", beds: 30, occupied: 21 },
          { ward: "General Ward", beds: 90, occupied: 65 },
          { ward: "Pediatrics", beds: 40, occupied: 24 },
          { ward: "Private", beds: 60, occupied: 16 },
        ].map((w) => (
          <div key={w.ward} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-sm text-muted-foreground">{w.ward}</div>
            <div className="mt-1 text-3xl font-extrabold text-secondary">{w.occupied}/{w.beds}</div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${w.occupied / w.beds * 100}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{Math.round(w.occupied / w.beds * 100)}% occupied</div>
          </div>
        ))}
      </div>
    </AppShell>
  ),
});
