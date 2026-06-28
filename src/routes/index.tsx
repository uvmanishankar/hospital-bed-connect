import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bed,
  Boxes,
  Users,
  ShieldCheck,
  Bell,
  BarChart3,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Monitor,
  ClipboardList,
  Star,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Send,
  ChevronRight,
} from "lucide-react";
import heroImg from "@/assets/hero-hospital.jpg";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HospitalCare — Real-Time Bed & Asset Management" },
      {
        name: "description",
        content:
          "Track beds, equipment, and staff in real time. Improve utilization, streamline operations, and deliver better patient care.",
      },
      { property: "og:title", content: "HospitalCare — Real-Time Bed & Asset Management" },
      {
        property: "og:description",
        content:
          "Track beds, equipment, and staff in real time. Improve utilization, streamline operations, and deliver better patient care.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-18 py-3 flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium ml-6">
            <a href="#home" className="text-primary border-b-2 border-primary pb-1">
              Home
            </a>
            <a href="#features" className="text-foreground/70 hover:text-foreground">
              Features
            </a>
            <a href="#dashboard" className="text-foreground/70 hover:text-foreground">
              Dashboard Preview
            </a>
            <a href="#about" className="text-foreground/70 hover:text-foreground">
              About Us
            </a>
            <a href="#contact" className="text-foreground/70 hover:text-foreground">
              Contact
            </a>
          </nav>
          <div className="flex-1" />
          <Link
            to="/login"
            className="hidden sm:inline-flex h-10 px-5 items-center rounded-lg border border-border text-sm font-semibold hover:bg-muted"
          >
            Login
          </Link>
          <Link
            to="/login"
            className="inline-flex h-10 px-5 items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 shadow-[var(--shadow-glow)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(120deg, #EAF7F8 0%, #DCEEEF 55%, #C9E5E7 100%)" }}
        />
        <img
          src={heroImg}
          alt="Modern hospital ward"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-90 hidden lg:block"
          style={{ maskImage: "linear-gradient(to right, transparent, black 20%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-xs font-semibold">
              <Sparkles size={14} /> Smart Hospital Management
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-secondary leading-[1.05] tracking-tight">
              Real-Time Hospital
              <br />
              <span className="gradient-text">Bed & Asset</span>
              <br />
              Management
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground/70 max-w-xl">
              Track beds, equipment, and staff availability in real time. Improve utilization,
              streamline operations, and deliver better patient care.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex h-12 px-6 items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95"
              >
                Login to Dashboard <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
              {["Real-time Updates", "Secure & Reliable", "Easy to Use"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Floating stats */}
          <div className="relative hidden lg:flex flex-col items-end gap-4">
            <FloatStat label="ICU Beds Available" value="32" sub="of 50" icon={<Bed size={16} />} />
            <FloatStat
              label="Equipment Online"
              value="256"
              sub="of 320"
              icon={<Monitor size={16} />}
            />
            <FloatStat label="Active Staff" value="128" sub="On Duty" icon={<Users size={16} />} />
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Beds",
              value: "256",
              sub: "Across all departments",
              icon: Bed,
              tone: "bg-info/10 text-info",
            },
            {
              label: "Available Beds",
              value: "98",
              sub: "38.3% of total",
              icon: CheckCircle2,
              tone: "bg-success/15 text-success",
            },
            {
              label: "Occupied Beds",
              value: "126",
              sub: "49.2% of total",
              icon: Users,
              tone: "bg-warning/15 text-amber-600",
            },
            {
              label: "Total Equipment",
              value: "320",
              sub: "Across all departments",
              icon: Monitor,
              tone: "bg-info/10 text-info",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl grid place-items-center ${s.tone}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-primary tabular-nums">{s.value}</div>
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold text-secondary">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary">
              Powerful Features for Better Care
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to manage your hospital efficiently
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              {
                t: "Real-time Bed Tracking",
                d: "Track bed availability across wards and departments in real time.",
                i: Bed,
                c: "from-blue-500 to-indigo-500",
              },
              {
                t: "Asset Management",
                d: "Monitor equipment status, maintenance, and utilization.",
                i: Boxes,
                c: "from-teal-500 to-emerald-500",
              },
              {
                t: "Staff Availability",
                d: "Manage staff schedules and real-time availability.",
                i: Users,
                c: "from-orange-500 to-amber-500",
              },
              {
                t: "Smart Alerts",
                d: "Get notified about critical shortages, requests, and maintenance.",
                i: Bell,
                c: "from-violet-500 to-purple-500",
              },
              {
                t: "Reports & Analytics",
                d: "Generate insightful reports and improve decision-making.",
                i: BarChart3,
                c: "from-emerald-500 to-teal-500",
              },
              {
                t: "Secure & Compliant",
                d: "Role-based access and data security compliance built-in.",
                i: ShieldCheck,
                c: "from-sky-500 to-blue-500",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="bg-card rounded-2xl border border-border p-5 text-center hover:shadow-[var(--shadow-elevated)] transition group"
              >
                <div
                  className={`h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br ${f.c} grid place-items-center text-white shadow-md group-hover:scale-105 transition`}
                >
                  <f.i size={24} />
                </div>
                <div className="mt-4 font-semibold text-secondary">{f.t}</div>
                <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="py-16 bg-gradient-to-b from-transparent to-muted/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-[1fr_2fr] gap-8 items-center">
          <div>
            <div className="text-xs font-bold tracking-wider text-primary">
              LIVE DASHBOARD PREVIEW
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-secondary leading-tight">
              All Your Operations,
              <br />
              At a Glance
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our intuitive dashboard provides real-time insights into bed availability, equipment
              status, requests, and more.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex h-11 px-5 items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95"
            >
              Explore Dashboard <ArrowRight size={16} />
            </Link>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold tracking-wider text-muted-foreground">
              HOW IT WORKS
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-secondary">
              Simple Steps, Better Management
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                n: 1,
                t: "Admission Request",
                d: "Create or receive admission requests for patients.",
                i: ClipboardList,
                c: "bg-blue-500",
              },
              {
                n: 2,
                t: "Auto Allocation",
                d: "System suggests the best available bed.",
                i: Bed,
                c: "bg-teal-500",
              },
              {
                n: 3,
                t: "Staff Assignment",
                d: "Assign staff and resources accordingly.",
                i: Users,
                c: "bg-orange-500",
              },
              {
                n: 4,
                t: "Analytics & Reports",
                d: "Monitor performance and generate insights.",
                i: BarChart3,
                c: "bg-violet-500",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className="relative bg-card rounded-2xl border border-border p-5 text-center"
              >
                <div
                  className={`absolute -top-3 left-5 h-7 w-7 rounded-full ${s.c} grid place-items-center text-white text-xs font-bold shadow`}
                >
                  {s.n}
                </div>
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted grid place-items-center text-secondary mt-2">
                  <s.i size={24} />
                </div>
                <div className="mt-3 font-semibold text-secondary">{s.t}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
                {i < 3 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-bold tracking-wider text-muted-foreground">
              TRUSTED BY HEALTHCARE PROFESSIONALS
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-secondary">What Our Users Say</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              {
                q: "HospitalCare has transformed our bed management process. Real-time tracking and alerts have significantly improved our efficiency.",
                n: "Dr. Anil Verma",
                r: "Medical Superintendent",
              },
              {
                q: "The asset tracking feature is excellent. We can now monitor all equipment and maintenance schedules in one place.",
                n: "Nurse Priya Nair",
                r: "Head of Nursing",
              },
              {
                q: "The dashboards and reports help us make data-driven decisions and improve patient care quality.",
                n: "Rohit Mehta",
                r: "Operations Manager",
              },
            ].map((t) => (
              <div key={t.n} className="bg-card rounded-2xl border border-border p-6">
                <div className="text-2xl text-primary leading-none">“</div>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">{t.q}</p>
                <div className="mt-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-white text-xs font-bold">
                    {t.n
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-secondary">{t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Logo variant="light" />
            <p className="mt-4 text-sm text-white/70 max-w-xs">
              Smart solutions for real-time hospital bed, asset, and staff management.
            </p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Twitter, Linkedin, Youtube].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 grid place-items-center rounded-lg bg-white/10 hover:bg-primary transition"
                >
                  <I size={16} />
                </a>
              ))}
            </div>
          </div>
          {[
            { t: "Product", l: ["Features", "Dashboard", "Pricing", "FAQs"] },
            { t: "Resources", l: ["Documentation", "User Guide", "API Reference", "Support"] },
            { t: "Company", l: ["About Us", "Contact Us", "Careers", "Privacy Policy"] },
          ].map((c) => (
            <div key={c.t}>
              <div className="font-semibold mb-3">{c.t}</div>
              <ul className="space-y-2 text-sm text-white/70">
                {c.l.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:col-span-1">
            <div className="font-semibold mb-3">Stay Updated</div>
            <p className="text-sm text-white/70">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form className="mt-4 flex h-11 rounded-lg overflow-hidden bg-white/10 border border-white/10">
              <input
                className="flex-1 bg-transparent px-3 outline-none text-sm placeholder:text-white/40"
                placeholder="Enter your email"
              />
              <button type="button" className="px-3 bg-primary hover:opacity-90">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} HospitalCare Bed Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FloatStat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl px-5 py-3.5 w-72 shadow-[var(--shadow-elevated)] flex items-center gap-3">
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-foreground/60 flex items-center gap-1.5">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold text-secondary tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <svg viewBox="0 0 100 32" className="h-10 w-24 text-primary">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points="0,24 15,20 30,22 45,14 60,18 75,8 90,12 100,4"
        />
      </svg>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-elevated)] bg-card grid grid-cols-[180px_1fr]">
      <div className="bg-secondary text-white p-3 space-y-1 text-[11px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-primary grid place-items-center">
            <Activity size={12} />
          </div>
          <div className="font-bold tracking-tight">HOSPITAL CARE</div>
        </div>
        {[
          "Dashboard",
          "Beds",
          "Rooms & Wards",
          "Bed Requests",
          "Admissions",
          "Discharges",
          "Assets & Equipment",
          "Asset Requests",
          "Staff Availability",
          "Reports & Analytics",
          "Notifications",
          "Settings",
        ].map((l, i) => (
          <div
            key={l}
            className={`px-2 py-1.5 rounded-md ${i === 0 ? "bg-primary" : "text-white/70"}`}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="p-4 bg-background">
        <div className="text-sm font-bold mb-3">Dashboard</div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { l: "Total Beds", v: "256", c: "text-info" },
            { l: "Available", v: "98", c: "text-success" },
            { l: "Occupied", v: "126", c: "text-amber-600" },
            { l: "Maintenance", v: "24", c: "text-violet-600" },
            { l: "Out of Service", v: "8", c: "text-destructive" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border p-2">
              <div className="text-[9px] text-muted-foreground">{s.l}</div>
              <div className={`text-base font-bold ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="col-span-1 rounded-lg border border-border p-2">
            <div className="text-[10px] font-semibold">Bed Occupancy</div>
            <svg viewBox="0 0 100 40" className="w-full h-12 mt-1 text-primary">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                points="0,30 15,25 30,28 45,18 60,22 75,12 90,18 100,8"
              />
            </svg>
          </div>
          <div className="col-span-1 rounded-lg border border-border p-2">
            <div className="text-[10px] font-semibold">Beds by Dept</div>
            <div className="h-12 mt-1 grid place-items-center">
              <div className="h-10 w-10 rounded-full border-[5px] border-primary/30 border-t-primary border-r-accent border-b-amber-500" />
            </div>
          </div>
          <div className="col-span-1 rounded-lg border border-border p-2">
            <div className="text-[10px] font-semibold">Recent Requests</div>
            <div className="space-y-1 mt-1">
              {["REQ-1021", "REQ-1030", "REQ-1008"].map((r) => (
                <div key={r} className="text-[9px] flex justify-between">
                  <span>{r}</span>
                  <span className="text-success">●</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}