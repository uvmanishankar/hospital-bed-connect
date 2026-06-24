import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — HospitalCare" }] }),
  component: () => (
    <AppShell title="Settings" breadcrumb={["Home", "Settings"]}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl">
        <h3 className="font-semibold text-secondary">ServiceNow Connection</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your ServiceNow instance secrets to enable live data sync. Tables used:
          <code className="px-1.5 py-0.5 mx-1 bg-muted rounded text-xs">u_hospital_bed</code>,
          <code className="px-1.5 py-0.5 mx-1 bg-muted rounded text-xs">u_hospital_asset</code>,
          <code className="px-1.5 py-0.5 mx-1 bg-muted rounded text-xs">u_bed_request</code>,
          <code className="px-1.5 py-0.5 mx-1 bg-muted rounded text-xs">u_staff_availability</code>.
        </p>
        <ul className="mt-4 text-sm space-y-1.5">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> SERVICENOW_INSTANCE</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> SERVICENOW_USERNAME</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> SERVICENOW_PASSWORD</li>
        </ul>
      </div>
    </AppShell>
  ),
});
