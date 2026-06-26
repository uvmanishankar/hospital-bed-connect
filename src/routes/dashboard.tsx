import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Bed,
  CheckCircle2,
  Users,
  Wrench,
  AlertTriangle,
  Monitor,
  UserCheck,
  TrendingUp,
  Bell,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { AppShell, StatCard } from "@/components/AppShell";
import { getDashboard } from "@/lib/servicenow.functions";

const dashOpts = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HospitalCare" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashOpts),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(dashOpts);
  const t = data.totals;

  return (
    <AppShell
      title="Dashboard"
      breadcrumb={["Home", "Dashboard"]}
      actions={
        <button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)]">
          <Plus size={16} /> Quick Action
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Beds"
          value={t.totalBeds}
          sublabel="All Departments"
          icon={Bed}
          tone="info"
        />
        <StatCard
          label="Available"
          value={t.availableBeds}  
          sublabel="38.3% Available"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Occupied"
          value={t.occupiedBeds}
          sublabel="49.2% Occupied"
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="Maintenance"
          value={t.maintenance}
          sublabel="9.4% of total"
          icon={Wrench}
          tone="accent"
        />
        <StatCard
          label="Out of Service"
          value={t.outOfService}
          sublabel="3.1% of total"
          icon={AlertTriangle}
          tone="danger"
        />
        <StatCard
          label="Active Staff"
          value={t.activeStaff}
          sublabel="On duty"
          icon={UserCheck}
          tone="primary"
        />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        {/* Occupancy */}
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-secondary">Bed Occupancy Overview</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <TrendingUp size={18} className="text-success" />
          </div>
          <div className="mt-4 h-52">
            <ResponsiveContainer>
              <AreaChart data={data.occupancyTrend}>
                <defs>
                  <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008C95" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#008C95" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#008C95"
                  strokeWidth={2}
                  fill="url(#occ)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Beds by Department */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-secondary">Beds by Department</h3>
          <p className="text-xs text-muted-foreground">Distribution across wards</p>
          <div className="mt-4 h-52 relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.bedsByDepartment}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.bedsByDepartment.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-secondary">{t.totalBeds}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {data.bedsByDepartment.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="flex-1">{d.name}</span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-secondary">Recent Bed Requests</h3>
            <a href="#" className="text-xs text-primary font-semibold">
              View All
            </a>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.recentRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                  <Bed size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-secondary truncate">{r.id}</div>
                  <div className="text-[11px] text-muted-foreground">{r.ward}</div>
                </div>
                <StatusPill status={r.status} />
                <div className="text-[10px] text-muted-foreground w-16 text-right">{r.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admissions trend */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-secondary">Admission & Discharge Trends</h3>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={data.admissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="admissions" fill="#008C95" radius={[6, 6, 0, 0]} />
                <Bar dataKey="discharges" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-secondary">SLA Alerts</h3>
            <Bell size={16} className="text-destructive" />
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                t: "ICU-1 capacity nearing limit",
                s: "Critical",
                color: "bg-destructive/10 text-destructive",
              },
              {
                t: "Ventilator AST-INF-007 due maintenance",
                s: "Warning",
                color: "bg-warning/15 text-amber-600",
              },
              {
                t: "3 admission requests pending > 30m",
                s: "SLA Risk",
                color: "bg-info/10 text-info",
              },
              {
                t: "General Ward staff shortage",
                s: "Warning",
                color: "bg-warning/15 text-amber-600",
              },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                <div className="h-8 w-8 rounded-lg bg-destructive/10 grid place-items-center shrink-0">
                  <AlertTriangle size={14} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-secondary">{a.t}</div>
                  <div className="mt-1 inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider items-center gap-1 ${a.color}">
                    <span
                      className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${a.color}`}
                    >
                      {a.s}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.source === "mock" && (
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
          <Monitor size={12} /> Data source:{" "}
          <span className="font-semibold text-foreground/70">mock</span> · Configure ServiceNow
          secrets to switch to live.
        </div>
      )}
    </AppShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-warning/15 text-amber-600",
    Approved: "bg-success/15 text-success",
    "In Progress": "bg-info/10 text-info",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-md ${map[status] ?? "bg-muted text-foreground/70"}`}
    >
      {status}
    </span>
  );
}
