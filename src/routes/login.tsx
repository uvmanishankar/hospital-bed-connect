import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Bed,
  Monitor,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import loginImg from "@/assets/login-hospital.jpg";
import { Logo } from "@/components/Logo";
import { login } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — HospitalCare" },
      { name: "description", content: "Sign in to HospitalCare Bed Management System." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(user || "priya.sharma@hospitalcare.io");
      navigate({ to: "/dashboard" });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-secondary p-4 sm:p-6 lg:p-10 grid place-items-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-2">
        {/* Left */}
        <div
          className="relative p-8 lg:p-10 min-h-[420px] flex flex-col"
          style={{ background: "linear-gradient(135deg, #EAF7F8 0%, #DCEEEF 100%)" }}
        >
          <Logo />
          <div className="mt-10 lg:mt-14 max-w-md">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-secondary leading-tight">
              Efficient Bed Management,
              <br />
              <span className="gradient-text">Better Patient Care</span>
            </h2>
            <p className="mt-4 text-foreground/70 text-sm lg:text-base">
              Real-time tracking of hospital beds, equipment, and staff availability for better
              healthcare management.
            </p>
          </div>
          <div className="flex-1 mt-6 relative rounded-2xl overflow-hidden min-h-[180px]">
            <img
              src={loginImg}
              alt="Hospital bed"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="mt-5 rounded-2xl bg-secondary/95 backdrop-blur p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white">
            {[
              { i: Bed, t: "Real-time Bed Tracking" },
              { i: Monitor, t: "Equipment Management" },
              { i: Users, t: "Staff Availability" },
              { i: ShieldCheck, t: "Improved Efficiency" },
            ].map((f) => (
              <div key={f.t} className="text-center">
                <div className="h-10 w-10 mx-auto rounded-full bg-primary grid place-items-center">
                  <f.i size={18} />
                </div>
                <div className="mt-2 text-[11px] font-semibold leading-tight">{f.t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto">
            <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 grid place-items-center">
              <UserIcon size={22} className="text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-secondary text-center">
              Welcome Back!
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Sign in to your account to continue
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-secondary">Username / Email</label>
                <div className="mt-1.5 relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-border bg-background focus:bg-white focus:border-primary outline-none text-sm transition"
                    placeholder="Enter your username or email"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-secondary">Password</label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-background focus:bg-white focus:border-primary outline-none text-sm transition"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-primary font-semibold hover:underline">
                  Forgot Password?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 shadow-[var(--shadow-glow)] transition disabled:opacity-70"
              >
                <Lock size={16} /> {loading ? "Signing in…" : "Login"}
              </button>

              <div className="relative text-center text-xs text-muted-foreground">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
                <span className="relative bg-white px-3">or continue with</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-11 rounded-xl border border-border font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-muted"
                >
                  <GoogleIcon /> Google
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl border border-border font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-muted"
                >
                  <MicrosoftIcon /> Microsoft
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <a href="#" className="text-primary font-semibold">
                  Contact Administrator
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.1-11.3-7.7l-6.5 5C9.4 39.6 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C40.7 35.4 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
