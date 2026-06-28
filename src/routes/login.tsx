import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, BadgeCheck, Bed, Monitor, Users, ShieldCheck } from "lucide-react";
import { useState } from "react";
import loginImg from "@/assets/login-hospital.jpg";
import { Logo } from "@/components/Logo";
import { saveUser } from "@/lib/auth-store";
import { authenticateEmployee } from "@/lib/servicenow.functions";

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
  const [show, setShow]       = useState(false);
  const [empId, setEmpId]     = useState("");
  const [pwd, setPwd]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!empId.trim()) { setError("Please enter your Employee ID."); return; }
    if (!pwd.trim())   { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const result = await authenticateEmployee({ data: { employeeId: empId.trim(), password: pwd } });

      if (result.ok && result.employee) {
        saveUser({
          sys_id:      result.employee.sys_id,
          name:        result.employee.name,
          email:       result.employee.email,
          employee_id: result.employee.employee_id,
          role:        result.employee.role,
        });
        navigate({ to: "/dashboard" });
      } else {
        setError(result.error ?? "Invalid Employee ID or Password.");
      }
    } catch {
      setError("Could not connect to ServiceNow. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary p-4 sm:p-6 lg:p-10 grid place-items-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-2">

        {/* ── Left panel ── */}
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
            <img src={loginImg} alt="Hospital" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="mt-5 rounded-2xl bg-secondary/95 backdrop-blur p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white">
            {[
              { i: Bed,        t: "Real-time Bed Tracking" },
              { i: Monitor,    t: "Equipment Management" },
              { i: Users,      t: "Staff Availability" },
              { i: ShieldCheck,t: "Improved Efficiency" },
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

        {/* ── Right panel ── */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto">
            <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 grid place-items-center">
              <BadgeCheck size={26} className="text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-secondary text-center">
              Staff Login
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Sign in with your Hospital Employee credentials
            </p>

            {/* Error message */}
            {error && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Employee ID */}
              <div>
                <label className="text-sm font-semibold text-secondary">Employee ID</label>
                <div className="mt-1.5 relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={empId}
                    onChange={(e) => { setEmpId(e.target.value); setError(""); }}
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-border bg-background focus:bg-white focus:border-primary outline-none text-sm transition"
                    placeholder="e.g. EMPL1002"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-semibold text-secondary">Password</label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => { setPwd(e.target.value); setError(""); }}
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-background focus:bg-white focus:border-primary outline-none text-sm transition"
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 shadow-[var(--shadow-glow)] transition disabled:opacity-70"
              >
                <Lock size={16} />
                {loading ? "Verifying…" : "Login"}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Don't have an account?{" "}
                <span className="text-primary font-semibold">Contact your Administrator</span>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}