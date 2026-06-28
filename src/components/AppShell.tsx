import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Bed,
  DoorOpen,
  ClipboardList,
  LogIn,
  LogOut,
  Stethoscope,
  Boxes,
  FileText,
  Users,
  Bell,
  Settings,
  HelpCircle,
  Search,
  Menu,
  ShieldCheck,
  ChevronDown,
  ListChecks,
  BrainCircuit,
  User,
  BadgeCheck,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { Logo } from "./Logo";
import { logout, useAuth } from "@/lib/auth-store";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Bed;
  badge?: number;
}
const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/beds", label: "Beds", icon: Bed },
  { to: "/rooms", label: "Rooms & Wards", icon: DoorOpen },
  { to: "/admissions", label: "Bed Requests", icon: ClipboardList, badge: 12 },
  { to: "/admissions", label: "Admissions", icon: LogIn },
  { to: "/discharges", label: "Discharges", icon: LogOut },
  { to: "/assets", label: "Assets & Equipment", icon: Boxes },
  { to: "/staff", label: "Staff Availability", icon: Users },
  { to: "/reports", label: "Reports & Analytics", icon: FileText },
  { to: "/ai-analysis", label: "AI Analysis", icon: BrainCircuit },
  { to: "/notifications", label: "Notifications", icon: Bell, badge: 5 },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  title,
  breadcrumb,
  actions,
}: {
  children: ReactNode;
  title: string;
  breadcrumb?: string[];
  actions?: ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="px-5 pt-5 pb-4 border-b border-sidebar-border">
          <Logo variant="light" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((it) => {
            const active =
              loc.pathname === it.to || (it.to !== "/dashboard" && loc.pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link
                key={it.label}
                to={it.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                <span className="flex-1 truncate">{it.label}</span>
                {it.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-white/20" : "bg-primary text-primary-foreground"}`}
                  >
                    {it.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-3">
          <div className="rounded-xl bg-sidebar-accent/60 p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center shrink-0">
              <ShieldCheck className="h-4.5 w-4.5 text-white" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                Current Role
              </div>
              <div className="text-sm font-semibold truncate">{user?.role ?? "Ward Manager"}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
          </div>
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white text-xs font-bold shrink-0">
              {(user?.name ?? "PS")
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">
                {user?.name ?? "Dr. Priya Sharma"}
              </div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">
                {user?.role ?? "Ward Manager"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <button
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-muted"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-white outline-none text-sm transition"
                  placeholder="Search beds, rooms, patients…"
                />
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/notifications" })}
              className="relative p-2 rounded-lg hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-4 w-4 grid place-items-center rounded-full bg-destructive text-white text-[9px] font-bold">
                5
              </span>
            </button>
            <button
              onClick={() => window.open("https://docs.lovable.dev", "_blank")}
              className="p-2 rounded-lg hover:bg-muted hidden sm:inline-flex"
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </button>
            <div className="relative flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-border" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted transition cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white text-xs font-bold shrink-0">
                  {(user?.name ?? "PS")
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <div className="text-sm font-semibold">{user?.name ?? "Staff"}</div>
                  <div className="text-[11px] text-muted-foreground">{user?.role ?? "nurse"}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground hidden sm:inline transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-border shadow-[var(--shadow-elevated)] z-50 overflow-hidden">
                  {/* Profile header */}
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white font-bold text-sm">
                        {(user?.name ?? "PS").split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-secondary">{user?.name ?? "Staff"}</div>
                        <div className="text-xs text-muted-foreground">{user?.email ?? ""}</div>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          <BadgeCheck size={10} /> {user?.employee_id ?? ""}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="p-2">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80">
                      <User size={15} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">Role</div>
                        <div className="text-xs text-muted-foreground capitalize">{user?.role ?? "nurse"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80">
                      <ShieldCheck size={15} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">Employee ID</div>
                        <div className="text-xs text-muted-foreground">{user?.employee_id ?? "—"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={() => { logout(); navigate({ to: "/login" }); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition font-medium"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page header */}
        <div className="px-4 lg:px-6 pt-6 pb-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary truncate">
                {title}
              </h1>
              {breadcrumb && (
                <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  {breadcrumb.map((b, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-muted-foreground/50">›</span>}
                      <span className={i === breadcrumb.length - 1 ? "text-foreground" : ""}>
                        {b}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 px-4 lg:px-6 py-4 pb-12">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: typeof Bed;
  tone?: "primary" | "success" | "warning" | "info" | "danger" | "accent";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-amber-600",
    info: "bg-info/15 text-info",
    danger: "bg-destructive/10 text-destructive",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition">
      <div className="flex items-start gap-3">
        <div className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${toneClass}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-2xl font-bold text-secondary tabular-nums">{value}</div>
          {sublabel && <div className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}