import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileDown, FileText } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

const occ = [
  { d: "Mon", v: 62 }, { d: "Tue", v: 68 }, { d: "Wed", v: 71 },
  { d: "Thu", v: 65 }, { d: "Fri", v: 74 }, { d: "Sat", v: 78 }, { d: "Sun", v: 70 },
];
const util = [
  { c: "Ventilators", u: 82 }, { c: "Monitors", u: 71 }, { c: "Wheelchairs", u: 54 },
  { c: "Infusion", u: 65 }, { c: "O2 Conc.", u: 48 },
];

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — HospitalCare" }] }),
  component: () => (
    <AppShell
      title="Reports & Analytics"
      breadcrumb={["Home", "Reports"]}
      actions={
        <>
          <button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl border border-border bg-white text-sm font-semibold"><FileDown size={16} /> Export CSV</button>
          <button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold"><FileText size={16} /> Export PDF</button>
        </>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-secondary">Weekly Occupancy</h3>
          <div className="h-64 mt-3"><ResponsiveContainer><LineChart data={occ}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="d" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="v" stroke="#008C95" strokeWidth={2.5} dot={{ fill: "#008C95" }} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-secondary">Asset Utilization</h3>
          <div className="h-64 mt-3"><ResponsiveContainer><BarChart data={util}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="c" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="u" fill="#14B8A6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="mt-4 bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-secondary mb-3">SLA Breaches (last 30 days)</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>{["Date", "Type", "Severity", "Resolution"].map(h => <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              ["18 May", "Bed allocation > 30m", "High", "Resolved in 12m"],
              ["15 May", "Ventilator maintenance overdue", "Medium", "Resolved"],
              ["12 May", "Staffing shortage ICU-2", "Critical", "Escalated"],
            ].map((r, i) => <tr key={i} className="border-b border-border">{r.map((c, j) => <td key={j} className="py-2.5 px-2">{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </AppShell>
  ),
});
