import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/discharges")({
  head: () => ({ meta: [{ title: "Discharges — HospitalCare" }] }),
  component: () => (
    <AppShell title="Discharges" breadcrumb={["Home", "Discharges"]}>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-secondary mb-4">Recent Discharges</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>{["Patient", "Bed", "Ward", "Discharged"].map(h => <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              ["Ravi Kumar", "ICU-1-02", "ICU", "Today 09:15"],
              ["Anjali Verma", "ICU-1-06", "ICU", "Yesterday"],
              ["Meera Reddy", "ICU-2-08", "ICU", "Yesterday"],
            ].map((r, i) => (
              <tr key={i} className="border-b border-border">
                {r.map((c, j) => <td key={j} className="py-3 px-2">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  ),
});
