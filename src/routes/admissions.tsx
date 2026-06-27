import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ClipboardList, Plus, RefreshCw, Stethoscope, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatCard } from "@/components/AppShell";
import {
  createPatientAdmission,
  getPatientAdmissions,
  updateConditionNotes,
} from "@/lib/servicenow.functions";

export const Route = createFileRoute("/admissions")({
  head: () => ({ meta: [{ title: "Admissions — HospitalCare" }] }),
  component: AdmissionsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientRecord {
  sys_id: string;
  number: string;
  patient_name: string;
  patient_age: string;
  gender: string;
  phone_number: string;
  condition_type: string;
  assigned_bed: string;
  condition_notes: string;
  ai_analysis: string;
  sys_created_on: string;
}

const CONDITION_COLORS: Record<string, string> = {
  General:    "bg-blue-100 text-blue-800",
  Emergency:  "bg-orange-100 text-orange-800",
  ICU:        "bg-red-100 text-red-800",
  Maternity:  "bg-pink-100 text-pink-800",
  Paediatric: "bg-purple-100 text-purple-800",
  Isolation:  "bg-amber-100 text-amber-800",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Nurse Update Drawer ──────────────────────────────────────────────────────
// ─── Condition Notes Drawer ───────────────────────────────────────────────────
// The nurse fills "Condition notes" after the doctor examination.
// Saving this PATCHes only `condition_notes` to ServiceNow.
// The Business Rule watches for condition_notes becoming non-blank, then calls
// the "Mistral AI API" REST Message with condition_notes + condition_type, and
// writes the AI response back into ai_analysis on the same record.
function NurseUpdateDrawer({
  patient,
  onClose,
  onSaved,
}: {
  patient: PatientRecord;
  onClose: () => void;
  onSaved: (sysId: string, conditionNotes: string) => void;
}) {
  const [conditionNotes, setConditionNotes] = useState(patient.condition_notes ?? "");

  const mutation = useMutation({
    mutationFn: (input: { sysId: string; conditionNotes: string }) =>
      updateConditionNotes({ data: input }),
    onSuccess: (result) => {
      const src = (result as { source?: string }).source;
      if (src === "servicenow") {
        toast.success("Condition notes saved", {
          description: "ServiceNow Business Rule will call Mistral AI and write the analysis back.",
        });
      } else {
        toast.info("Saved (mock mode)", {
          description: "ServiceNow env vars not set — record was not sent.",
        });
      }
      onSaved(patient.sys_id, conditionNotes);
      onClose();
    },
    onError: (err: unknown) => {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : "Unknown error from ServiceNow.",
      });
    },
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Stethoscope size={18} className="text-primary" />
              Update condition notes
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.number} · {patient.patient_name} · Bed {patient.assigned_bed || "—"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Read-only patient summary */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Age / Gender</div>
              <div className="font-medium mt-0.5">{patient.patient_age}y · {patient.gender}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Condition type</div>
              <div className="font-medium mt-0.5">{patient.condition_type}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Phone</div>
              <div className="font-medium mt-0.5 text-xs">{patient.phone_number}</div>
            </div>
          </div>

          {/* Condition notes — the single field sent to ServiceNow */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Condition notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={5}
              placeholder="Enter diagnosis, vitals, medications administered, patient response, and any observations after doctor examination…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
              Saving this will automatically trigger Mistral AI analysis via ServiceNow Business Rule.
            </p>
          </div>

          {/* Show existing AI analysis if already available */}
          {patient.ai_analysis && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-purple-700 mb-1.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                AI Analysis (written by ServiceNow · Mistral AI API)
              </div>
              <p className="text-sm text-purple-900 leading-relaxed">{patient.ai_analysis}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Cancel
          </button>
          <button
            disabled={mutation.isPending || !conditionNotes.trim()}
            onClick={() => mutation.mutate({ sysId: patient.sys_id, conditionNotes })}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {mutation.isPending ? "Saving…" : "Save & trigger AI"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Row ──────────────────────────────────────────────────────────────
function PatientRow({
  record,
  onUpdateClick,
}: {
  record: PatientRecord;
  onUpdateClick: (r: PatientRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNotes = !!record.condition_notes?.trim();
  const hasAI = !!record.ai_analysis?.trim();

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
        <td className="py-3 px-3 text-xs font-mono text-primary font-semibold">{record.number || "—"}</td>
        <td className="py-3 px-3 font-semibold text-sm text-gray-800">{record.patient_name}</td>
        <td className="py-3 px-3 text-sm text-gray-600">{record.patient_age}y · {record.gender}</td>
        <td className="py-3 px-3">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-md ${
              CONDITION_COLORS[record.condition_type] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {record.condition_type}
          </span>
        </td>
        <td className="py-3 px-3 text-sm font-mono text-gray-700">
          {record.assigned_bed || <span className="text-amber-600 text-xs font-semibold">Pending</span>}
        </td>
        <td className="py-3 px-3 text-xs text-gray-500">
          <div>{new Date(record.sys_created_on).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
          <div className="text-gray-400">{new Date(record.sys_created_on).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            {/* Status badges */}
            {hasNotes && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                Diagnosed
              </span>
            )}
            {hasAI && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                AI Ready
              </span>
            )}
            {/* Expand/collapse AI analysis */}
            {(hasNotes || hasAI) && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
                title="View details"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {/* Update button */}
            <button
              onClick={() => onUpdateClick(record)}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
            >
              Update
            </button>
          </div>
        </td>
      </tr>
      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={7} className="px-4 py-3 space-y-2">
            {hasNotes && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Condition notes: </span>
                <span className="text-sm text-gray-800">{record.condition_notes}</span>
              </div>
            )}
            {hasAI && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-1">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">AI Analysis: </span>
                <span className="text-sm text-purple-900">{record.ai_analysis}</span>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdmissionsPage() {
  // ── New Admission modal state ──
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [insurance, setInsurance] = useState("");
  const [address, setAddress] = useState("");
  const [conditionType, setConditionType] = useState("");
  const [showHospSuggestions, setShowHospSuggestions] = useState(false);
  const [allHospitals, setAllHospitals] = useState<string[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalFetchError, setHospitalFetchError] = useState<string | null>(null);
  const [activeHospIndex, setActiveHospIndex] = useState(-1);
  const [firstHospFetch, setFirstHospFetch] = useState(false);
  const referredRef = useRef<HTMLInputElement | null>(null);
  const blurTimer = useRef<number | null>(null);

  // ── Filter state ──
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "pending" | "assigned" | "diagnosed" | "ai"

  // ── Nurse update drawer ──
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // ── Optimistic local overrides for the list (before next refetch) ──
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, { condition_notes: string }>
  >({});

  const qc = useQueryClient();

  // ── Live patient admissions from ServiceNow ──
  const { data: admissionsData, isFetching: admissionsFetching, refetch } = useQuery({
    queryKey: ["patientAdmissions"],
    queryFn: () => getPatientAdmissions(),
    refetchInterval: 30_000, // poll every 30s so bed assignments appear automatically
  });

  // Helper: ServiceNow reference fields can come back as objects {value, display_value}
  // or plain strings. Always extract a safe string.
  function snStr(val: unknown): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      const o = val as Record<string, unknown>;
      return String(o.display_value ?? o.value ?? "");
    }
    return String(val);
  }

  const admissions: PatientRecord[] = ((admissionsData as { admissions?: unknown[] })?.admissions ?? []).map(
    (raw) => {
      const r = raw as Record<string, unknown>;
      return {
        sys_id:          snStr(r.sys_id),
        number:          snStr(r.number),
        patient_name:    snStr(r.patient_name),
        patient_age:     snStr(r.patient_age),
        gender:          snStr(r.gender),
        phone_number:    snStr(r.phone_number),
        condition_type:  snStr(r.condition_type),
        assigned_bed:    snStr(r.assigned_bed),
        condition_notes: snStr(localOverrides[snStr(r.sys_id)]?.condition_notes ?? r.condition_notes),
        ai_analysis:     snStr(r.ai_analysis),
        sys_created_on:  snStr(r.sys_created_on),
      } satisfies PatientRecord;
    },
  );

  const pending   = admissions.filter((r) => !r.assigned_bed || r.assigned_bed.trim() === "");
  const approved  = admissions.filter((r) => !!r.assigned_bed && !r.condition_notes);
  const diagnosed = admissions.filter((r) => !!r.condition_notes);
  const withAI    = admissions.filter((r) => !!r.ai_analysis);

  // ── Apply filters ──
  const filteredAdmissions = admissions.filter((r) => {
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matches =
        r.patient_name.toLowerCase().includes(q) ||
        r.number?.toLowerCase().includes(q) ||
        r.assigned_bed?.toLowerCase().includes(q) ||
        r.phone_number?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filterCondition && r.condition_type !== filterCondition) return false;
    if (filterStatus === "pending"   && (!!r.assigned_bed && r.assigned_bed.trim() !== "")) return false;
    if (filterStatus === "assigned"  && (!r.assigned_bed || !!r.condition_notes)) return false;
    if (filterStatus === "diagnosed" && !r.condition_notes) return false;
    if (filterStatus === "ai"        && !r.ai_analysis) return false;
    return true;
  });

  // ── Hospital autocomplete ──
  const filteredHospitals = allHospitals
    .filter((h) =>
      referredBy.trim() === "" ? true : h.toLowerCase().includes(referredBy.trim().toLowerCase()),
    )
    .slice(0, 10);

  async function fetchHospitals() {
    if (firstHospFetch || hospitalsLoading) return;
    setHospitalsLoading(true);
    setHospitalFetchError(null);
    try {
      const query = `
[out:json][timeout:25][maxsize:1073741824];
area["name"="India"]["boundary"="administrative"]["admin_level"="2"]->.india;
(
  node["amenity"="hospital"]["name"](area.india);
  way["amenity"="hospital"]["name"](area.india);
  relation["amenity"="hospital"]["name"](area.india);
);
out tags center qt 1000;
`;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      });
      if (!response.ok) throw new Error(`Overpass fetch failed: ${response.status}`);
      const data = await response.json();
      const names = new Set<string>();
      for (const element of data.elements ?? []) {
        const n = element.tags?.name;
        if (typeof n === "string" && n.trim().length > 0) names.add(n.trim());
      }
      const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
      setAllHospitals(sorted);
      if (sorted.length === 0) setHospitalFetchError("No hospitals found from Overpass.");
    } catch (error) {
      setHospitalFetchError(
        error instanceof Error ? error.message : "Failed to load hospital list.",
      );
    } finally {
      setHospitalsLoading(false);
      setFirstHospFetch(true);
    }
  }

  function selectHospital(n: string) {
    setReferredBy(n);
    setShowHospSuggestions(false);
    setActiveHospIndex(-1);
  }

  function handleHospKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showHospSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveHospIndex((i) => Math.min(i + 1, filteredHospitals.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveHospIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeHospIndex >= 0 && filteredHospitals[activeHospIndex]) {
        e.preventDefault();
        selectHospital(filteredHospitals[activeHospIndex]);
      }
    } else if (e.key === "Escape") {
      setShowHospSuggestions(false);
    }
  }

  useEffect(() => {
    return () => {
      if (blurTimer.current != null) window.clearTimeout(blurTimer.current);
    };
  }, []);

  // ── New Admission mutation ──
  const createMutation = useMutation({
    mutationFn: (input: {
      fullName: string; age: string; gender: string; contactNumber: string;
      bloodGroup: string; emergencyContact: string; referredBy: string;
      insuranceAadhaarId: string; address: string; conditionType: string;
    }) => createPatientAdmission({ data: input }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["patientAdmissions"] });
      setOpen(false);
      setName(""); setAge(""); setGender(""); setContactNumber(""); setBloodGroup("");
      setEmergencyContact(""); setReferredBy(""); setInsurance(""); setAddress(""); setConditionType("");

      if ((result as { source?: string }).source === "servicenow") {
        const patNum = (result as { patientNumber?: string }).patientNumber;
        toast.success("Admission submitted to ServiceNow", {
          description: `Patient ID: ${patNum || "assigned by ServiceNow"}. The Business Rule will auto-assign a bed.`,
        });
      } else {
        const patNum = (result as { patientNumber?: string }).patientNumber ?? "PAT0001";
        toast.info("Saved in mock mode", {
          description: `Patient ID: ${patNum} — ServiceNow env vars not set.`,
        });
      }
    },
    onError: (err: unknown) => {
      toast.error("Failed to submit admission", {
        description: err instanceof Error ? err.message : "Unknown error from ServiceNow.",
      });
    },
  });

  return (
    <AppShell
      title="Admissions"
      breadcrumb={["Home", "Admissions"]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex h-10 px-3 items-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            <RefreshCw size={14} className={admissionsFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)]"
          >
            <Plus size={16} /> New Admission
          </button>
        </div>
      }
    >
      {/* Stat cards — click to quick-filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            { label: "Pending Bed",  value: pending.length,   tone: "warning", key: "pending",   sublabel: "Awaiting bed assignment" },
            { label: "Bed Assigned", value: approved.length,  tone: "success", key: "assigned",  sublabel: "Bed assigned, awaiting diagnosis" },
            { label: "Diagnosed",    value: diagnosed.length, tone: "primary", key: "diagnosed", sublabel: "Doctor diagnosis recorded" },
            { label: "AI Analysed",  value: withAI.length,    tone: "accent",  key: "ai",        sublabel: "AI analysis complete" },
          ] as Array<{ label: string; value: number; tone: "warning"|"success"|"primary"|"accent"; key: string; sublabel: string }>
        ).map(({ label, value, tone, key, sublabel }) => (
          <div
            key={key}
            onClick={() => setFilterStatus((prev) => prev === key ? "" : key)}
            className={`cursor-pointer rounded-2xl transition ring-2 ${filterStatus === key ? "ring-primary scale-[1.02]" : "ring-transparent"}`}
          >
            <StatCard
              label={label}
              value={admissionsFetching && admissions.length === 0 ? "…" : value}
              icon={ClipboardList}
              tone={tone}
              sublabel={sublabel}
            />
          </div>
        ))}
      </div>

      {/* Live patient list */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-secondary flex items-center gap-2">
            Patient Admissions
            {(admissionsData as { source?: string })?.source === "mock" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">MOCK DATA</span>
            )}
            <span className="text-xs font-normal text-muted-foreground">
              ({filteredAdmissions.length} of {admissions.length})
            </span>
          </h3>
          <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/40 rounded-xl border border-border">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, ID, bed, phone…"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Condition type filter */}
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="h-8 px-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-primary"
          >
            <option value="">All Conditions</option>
            <option value="General">General</option>
            <option value="Emergency">Emergency</option>
            <option value="ICU">ICU</option>
            <option value="Maternity">Maternity</option>
            <option value="Paediatric">Paediatric</option>
            <option value="Isolation">Isolation</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Bed</option>
            <option value="assigned">Bed Assigned</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="ai">AI Analysed</option>
          </select>

          {/* Clear filters */}
          {(filterSearch || filterCondition || filterStatus) && (
            <button
              onClick={() => { setFilterSearch(""); setFilterCondition(""); setFilterStatus(""); }}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-border bg-white text-muted-foreground hover:text-destructive hover:border-destructive transition"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {filteredAdmissions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {admissions.length === 0
              ? "No admissions found. Submit a new admission above."
              : "No admissions match the current filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  {["Patient ID", "Patient", "Age / Gender", "Condition", "Bed", "Admitted", "Actions"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((record) => (
                  <PatientRow
                    key={record.sys_id}
                    record={record}
                    onUpdateClick={setSelectedPatient}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Nurse Update Drawer ── */}
      {selectedPatient && (
        <NurseUpdateDrawer
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSaved={(sysId, conditionNotes) => {
            setLocalOverrides((prev) => ({
              ...prev,
              [sysId]: { condition_notes: conditionNotes },
            }));
            // Refetch after a short delay to pick up AI analysis written by ServiceNow
            setTimeout(() => qc.invalidateQueries({ queryKey: ["patientAdmissions"] }), 5000);
          }}
        />
      )}

      {/* ── New Admission Modal ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="patient-card" onClick={(e) => e.stopPropagation()}>
            <div className="header">
              <h2>Patient Details</h2>
              <p>Enter patient information to begin admission</p>
            </div>

            <form
              className="form-area"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                if (!form.reportValidity()) return;
                createMutation.mutate({
                  fullName: name, age, gender, contactNumber, bloodGroup,
                  emergencyContact, referredBy, insuranceAadhaarId: insurance,
                  address, conditionType,
                });
              }}
            >
              <div className="grid">
                <div className="group">
                  <label>Full Name<span className="req">*</span></label>
                  <input type="text" placeholder="e.g. Manish Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="group">
                  <label>Age<span className="req">*</span></label>
                  <input type="number" placeholder="e.g. 45" value={age} onChange={(e) => setAge(e.target.value)} required />
                </div>
                <div className="group">
                  <label>Gender<span className="req">*</span></label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="group">
                  <label>Contact Number<span className="req">*</span></label>
                  <input
                    value={contactNumber}
                    onChange={(e) => {
                      // only digits, max 10
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setContactNumber(val);
                    }}
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    title="Enter a valid 10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="group">
                  <label>Condition Type<span className="req">*</span></label>
                  <select value={conditionType} onChange={(e) => setConditionType(e.target.value)} required>
                    <option value="">Select condition type</option>
                    <option value="General">General</option>
                    <option value="Emergency">Emergency</option>
                    <option value="ICU">ICU</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Paediatric">Paediatric</option>
                    <option value="Isolation">Isolation</option>
                  </select>
                </div>
                <div className="group">
                  <label>Blood Group<span className="req">*</span></label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                    <option value="">Select blood group</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                    <option>O+</option><option>O-</option>
                  </select>
                </div>
                <div className="group">
                  <label>Emergency Contact</label>
                  <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Name & number" />
                </div>
                <div className="group" style={{ position: "relative" }}>
                  <label>Referred By</label>
                  <input
                    placeholder="Doctor name / Hospital"
                    value={referredBy}
                    onFocus={() => { fetchHospitals(); setShowHospSuggestions(true); }}
                    onChange={(e) => { setReferredBy(e.target.value); setShowHospSuggestions(true); }}
                    onBlur={() => { blurTimer.current = window.setTimeout(() => setShowHospSuggestions(false), 150); }}
                    onKeyDown={handleHospKeyDown}
                    ref={referredRef}
                  />
                  {showHospSuggestions && (
                    <ul className="hosp-suggestions">
                      {hospitalsLoading ? (
                        <li className="loading">Loading hospitals…</li>
                      ) : hospitalFetchError ? (
                        <li className="loading">{hospitalFetchError}</li>
                      ) : filteredHospitals.length === 0 ? (
                        <li className="loading">No hospitals found.</li>
                      ) : (
                        filteredHospitals.map((h, i) => (
                          <li
                            key={h}
                            className={i === activeHospIndex ? "active" : undefined}
                            onMouseDown={(ev) => { ev.preventDefault(); selectHospital(h); }}
                            onMouseEnter={() => setActiveHospIndex(i)}
                          >
                            {h}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <div className="group">
                  <label>Insurance / Aadhaar ID</label>
                  <input value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="Insurance policy" />
                </div>
                <div className="group full">
                  <label>Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
                </div>
              </div>

              <div className="footer">
                <button type="submit" disabled={createMutation.isPending} className="btn">
                  {createMutation.isPending ? "Submitting…" : "Submit Admission"}
                </button>
              </div>
              {createMutation.isError && (
                <p className="text-xs text-destructive mt-2">
                  {createMutation.error instanceof Error
                    ? createMutation.error.message
                    : "Failed to send admission to ServiceNow."}
                </p>
              )}
            </form>

            <style>{`
.patient-card{background:#ffffff;border-radius:20px;overflow:hidden;max-width:900px;margin:auto;box-shadow:0 10px 30px rgba(0,0,0,.06);width:100%;max-height:80vh}
.patient-card *{box-sizing:border-box;font-family:inherit}
.patient-card .header{padding:20px;border-bottom:1px solid #e6edf5}
.patient-card .header h2{color:#10213b;font-size:22px;margin-bottom:4px}
.patient-card .header p{color:#6a7f98;font-size:13px}
.patient-card .form-area{padding:16px;max-height:calc(80vh - 120px);overflow:auto}
.patient-card .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.patient-card .group{display:flex;flex-direction:column}
.patient-card .full{grid-column:1/-1}
.patient-card label{font-size:14px;font-weight:600;margin-bottom:6px;color:#20334c}
.patient-card .req{color:red;margin-left:4px}
.patient-card input,.patient-card select{height:42px;border:2px solid #d7e2ee;border-radius:10px;padding:0 12px;font-size:14px;outline:none;background:white;transition:.2s}
.patient-card input:focus,.patient-card select:focus{border-color:#1f75b8;box-shadow:0 0 0 4px rgba(31,117,184,.15)}
.patient-card .footer{display:flex;justify-content:flex-end;margin-top:12px;padding:12px}
.patient-card .btn{background:#0d5d93;color:white;border:none;padding:10px 18px;font-size:15px;font-weight:700;border-radius:10px;cursor:pointer;transition:.2s}
.patient-card .btn:hover{background:#094d78}
.patient-card .btn:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:850px){.patient-card .grid{grid-template-columns:1fr}}
.patient-card .hosp-suggestions{position:absolute;z-index:60;left:0;right:0;background:white;border:1px solid rgba(0,0,0,0.08);border-radius:8px;margin-top:6px;max-height:200px;overflow:auto;padding:0;list-style:none}
.patient-card .hosp-suggestions li{padding:8px 12px;border-bottom:1px solid rgba(0,0,0,0.03);cursor:pointer;font-size:13px}
.patient-card .hosp-suggestions li.active,.patient-card .hosp-suggestions li:hover{background:#eef6ff}
.patient-card .hosp-suggestions li.loading{color:#888;font-style:italic}
`}</style>
          </div>
        </div>
      )}
    </AppShell>
  );
}