import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Plus, Send } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { createAdmission } from "@/lib/servicenow.functions";

export const Route = createFileRoute("/admissions")({
  head: () => ({ meta: [{ title: "Admissions — HospitalCare" }] }),
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ward, setWard] = useState("ICU");
  const [diag, setDiag] = useState("");
  const [priority, setPriority] = useState("normal");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (input: { patientName: string; ward: string; diagnosis: string; priority: string }) =>
      createAdmission({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); setName(""); setDiag("");
    },
  });

  const recent = [
    { id: "REQ-BED-1021", patient: "Anita Roy", ward: "ICU - 2", status: "Pending", time: "10 min ago" },
    { id: "REQ-BED-1030", patient: "Mahesh Kumar", ward: "General Ward", status: "Approved", time: "20 min ago" },
    { id: "REQ-BED-1008", patient: "Pooja Patel", ward: "Pediatrics", status: "Pending", time: "1 hr ago" },
    { id: "REQ-BED-1007", patient: "Vikram Singh", ward: "ICU - 1", status: "In Progress", time: "2 hr ago" },
  ];

  return (
    <AppShell
      title="Admissions"
      breadcrumb={["Home", "Admissions"]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)]">
          <Plus size={16} /> New Admission
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={6} icon={ClipboardList} tone="warning" />
        <StatCard label="Approved Today" value={18} icon={ClipboardList} tone="success" />
        <StatCard label="Auto-Allocated" value={11} icon={ClipboardList} tone="primary" />
        <StatCard label="SLA Breaches" value={1} icon={ClipboardList} tone="danger" />
      </div>

      <div className="mt-6 bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-secondary mb-4">Recent Admission Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>{["Request ID", "Patient", "Ward", "Status", "Submitted"].map(h => <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/40">
                  <td className="py-3 px-2 font-semibold">{r.id}</td>
                  <td className="py-3 px-2">{r.patient}</td>
                  <td className="py-3 px-2">{r.ward}</td>
                  <td className="py-3 px-2"><span className="text-[10px] font-bold px-2 py-1 rounded-md bg-warning/15 text-amber-600">{r.status}</span></td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-secondary">New Admission Request</h2>
            <p className="text-xs text-muted-foreground">Submit to ServiceNow u_bed_request table.</p>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ patientName: name, ward, diagnosis: diag, priority }); }} className="mt-4 space-y-3">
              <Field label="Patient Name"><input value={name} onChange={(e) => setName(e.target.value)} required className="input" /></Field>
              <Field label="Ward">
                <select value={ward} onChange={(e) => setWard(e.target.value)} className="input">
                  {["ICU", "General Ward", "Pediatrics", "Private"].map(w => <option key={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Diagnosis"><textarea value={diag} onChange={(e) => setDiag(e.target.value)} rows={2} className="input" /></Field>
              <Field label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
                  {["normal", "high", "critical"].map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="h-10 px-4 rounded-lg border border-border text-sm">Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold inline-flex items-center gap-2">
                  <Send size={14} /> {mutation.isPending ? "Submitting…" : "Submit"}
                </button>
              </div>
              {mutation.data && <p className="text-xs text-success">✓ Saved to {mutation.data.source}.</p>}
            </form>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;height:40px;padding:0 12px;border-radius:8px;border:1px solid var(--color-border);background:white;font-size:14px;outline:none}.input:focus{border-color:var(--color-primary)}textarea.input{height:auto;padding-top:8px}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-secondary">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
