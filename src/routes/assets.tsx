import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Box, CheckCircle2, Activity, Wrench, AlertCircle, Filter, Plus, Search, MoreVertical,
  Stethoscope, MonitorSmartphone, Accessibility, Droplets, Wind, TrendingUp, Clock, Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell, StatCard } from "@/components/AppShell";
import { getAssets } from "@/lib/servicenow.functions";
import { mockAssets, type Asset, type AssetStatus } from "@/lib/mock-data";

const assetsOpts = queryOptions({
  queryKey: ["assets"],
  queryFn: () => getAssets(),
});

export const Route = createFileRoute("/assets")({
  head: () => ({ meta: [{ title: "Asset Tracking — HospitalCare" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(assetsOpts),
  component: AssetsPage,
});

const tabs = ["All Assets", "In Use", "Available", "Under Maintenance", "Out of Service"] as const;
type Tab = typeof tabs[number];

const tabToStatus: Record<Tab, AssetStatus | null> = {
  "All Assets": null,
  "In Use": "in_use",
  Available: "available",
  "Under Maintenance": "maintenance",
  "Out of Service": "out_of_service",
};

function AssetsPage() {
  const { data } = useSuspenseQuery(assetsOpts);
  const assets: Asset[] = useMemo(() => (data.source === "mock" ? data.assets : mockAssets), [data]);
  const [tab, setTab] = useState<Tab>("All Assets");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const status = tabToStatus[tab];
    return assets.filter(a =>
      (!status || a.status === status) &&
      (q === "" || `${a.name} ${a.tag} ${a.model} ${a.location}`.toLowerCase().includes(q.toLowerCase()))
    );
  }, [assets, tab, q]);

  const totals = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.status === "available").length,
    inUse: assets.filter(a => a.status === "in_use").length,
    maintenance: assets.filter(a => a.status === "maintenance").length,
    out: assets.filter(a => a.status === "out_of_service").length,
  }), [assets]);

  return (
    <AppShell
      title="Assets & Equipment"
      breadcrumb={["Home", "Assets & Equipment"]}
      actions={
        <>
          <button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl border border-border bg-white text-sm font-semibold hover:bg-muted">
            <Filter size={16} /> Filters
          </button>
          <button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)]">
            <Plus size={16} /> Request New Asset
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total Assets" value="256" sublabel="All Assets" icon={Box} tone="info" />
        <StatCard label="Available" value="98" sublabel="38.3% Available" icon={CheckCircle2} tone="success" />
        <StatCard label="In Use" value="126" sublabel="49.2% In Use" icon={Activity} tone="warning" />
        <StatCard label="Under Maintenance" value="24" sublabel="9.4% Maintenance" icon={Wrench} tone="accent" />
        <StatCard label="Out of Service" value="8" sublabel="3.1% Out of Service" icon={AlertCircle} tone="danger" />
      </div>

      <div className="mt-6 grid xl:grid-cols-[1fr_340px] gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          {/* Tabs */}
          <div className="border-b border-border overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 text-sm font-semibold whitespace-nowrap ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_2fr] gap-3">
            <SelectField label="Asset Type" options={["All Types", "Ventilator", "Monitor", "Wheelchair", "Infusion Pump"]} />
            <SelectField label="Location" options={["All Locations", "ICU - 1", "ICU - 2", "General Ward", "Pediatrics"]} />
            <SelectField label="Status" options={["All Status", "Available", "In Use", "Maintenance"]} />
            <div>
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 rounded-lg border border-border bg-white text-sm outline-none focus:border-primary"
                  placeholder="Search in table…"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  {["Asset Tag", "Asset Name", "Asset Type", "Location", "Status", "Assigned To", "Last Updated", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-muted/40">
                    <td className="py-3 px-2 font-semibold text-secondary whitespace-nowrap">{a.tag}</td>
                    <td className="py-3 px-2">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">Model: {a.model}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <AssetTypeIcon type={a.type} /> {a.type}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div>{a.location}</div>
                      <div className="text-[11px] text-muted-foreground">{a.room}</div>
                    </td>
                    <td className="py-3 px-2"><AssetStatusBadge status={a.status} /></td>
                    <td className="py-3 px-2 text-xs">
                      {a.assignedTo ? (
                        <>
                          <div>Patient: {a.assignedTo}</div>
                          <div className="text-muted-foreground">Bed: {a.bed}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground whitespace-nowrap">{a.lastUpdated}</td>
                    <td className="py-3 px-2"><button className="p-1 hover:bg-muted rounded-md"><MoreVertical size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div>Showing 1 to {visible.length} of {assets.length} assets</div>
            <div className="flex items-center gap-1">
              <button className="h-7 w-7 rounded-md border border-border">‹</button>
              <button className="h-7 w-7 rounded-md bg-primary text-white">1</button>
              <button className="h-7 w-7 rounded-md border border-border">2</button>
              <button className="h-7 w-7 rounded-md border border-border">3</button>
              <button className="h-7 w-7 rounded-md border border-border">›</button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-secondary">Asset Categories</h3>
            <div className="mt-4 h-44 relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.categories} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {data.categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-secondary">256</div>
                  <div className="text-[10px] text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              {data.categories.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-semibold">{c.value} ({Math.round(c.value / 256 * 1000) / 10}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-secondary">Recent Asset Requests</h3>
              <a href="#" className="text-xs text-primary font-semibold">View All</a>
            </div>
            <div className="mt-3 space-y-2.5">
              {data.requests.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                    <Box size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{r.id}</div>
                    <div className="text-[11px] text-muted-foreground">{r.asset} · {r.location}</div>
                  </div>
                  <RequestPill status={r.status} />
                  <div className="text-[10px] text-muted-foreground w-16 text-right">{r.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Utilization summary */}
      <div className="mt-4 bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-secondary">Asset Utilization Summary</h3>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Utilization Rate", v: "78.5%", i: TrendingUp, c: "bg-info/10 text-info" },
            { l: "Avg. Time in Use", v: "12h 30m", i: Clock, c: "bg-success/15 text-success" },
            { l: "Maintenance Due", v: "12 Assets", i: Wrench, c: "bg-warning/15 text-amber-600" },
            { l: "Calibration Due", v: "5 Assets", i: Calendar, c: "bg-violet-500/10 text-violet-600" },
            { l: "Expired Assets", v: "2 Assets", i: AlertCircle, c: "bg-destructive/10 text-destructive" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${s.c}`}><s.i size={18} /></div>
              <div>
                <div className="text-[11px] text-muted-foreground">{s.l}</div>
                <div className="font-bold text-secondary">{s.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select className="mt-1 w-full h-9 px-3 rounded-lg border border-border bg-white text-sm outline-none focus:border-primary">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, { l: string; c: string }> = {
    available: { l: "Available", c: "bg-success/15 text-success" },
    in_use: { l: "In Use", c: "bg-destructive/10 text-destructive" },
    maintenance: { l: "Under Maintenance", c: "bg-warning/15 text-amber-600" },
    out_of_service: { l: "Out of Service", c: "bg-muted text-foreground/60" },
  };
  const s = map[status];
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${s.c}`}>{s.l}</span>;
}

function AssetTypeIcon({ type }: { type: string }) {
  const map: Record<string, typeof Stethoscope> = {
    Ventilator: Wind, Monitor: MonitorSmartphone, Wheelchair: Accessibility,
    "Infusion Pump": Droplets, "Oxygen Concentrator": Stethoscope,
  };
  const Icon = map[type] ?? Box;
  return <Icon size={14} className="text-primary" />;
}

function RequestPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Approved: "bg-success/15 text-success",
    Pending: "bg-warning/15 text-amber-600",
    "In Progress": "bg-info/10 text-info",
  };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
