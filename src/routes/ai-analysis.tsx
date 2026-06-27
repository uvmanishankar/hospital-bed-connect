import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RefreshCw, TrendingDown, Clock, BedDouble } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { getAiAnalysis } from "@/lib/servicenow.functions";

export const Route = createFileRoute("/ai-analysis")({
  head: () => ({ meta: [{ title: "AI Analysis — HospitalCare" }] }),
  component: AiAnalysisPage,
});

interface AnalysisRecord {
  sys_id: string;
  patient_name: string;
  condition_type: string;
  bed_number: string;
  nurse_diagnosis: string;
  ai_analysis: string;
  sys_created_on: string;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical:  "bg-red-100 text-red-800",
  Emergency: "bg-orange-100 text-orange-800",
  Serious:   "bg-amber-100 text-amber-800",
  Stable:    "bg-green-100 text-green-800",
  Minor:     "bg-blue-100 text-blue-800",
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

// Extract the first number that looks like "N days" or "N–M days" from ai_analysis text
function extractDays(text: string): string | null {
  const m = text.match(/(\d+)[–\-–]?(\d+)?\s*days?/i);
  if (!m) return null;
  return m[2] ? `${m[1]}–${m[2]}d` : `${m[1]}d`;
}

function AnalysisCard({ record }: { record: AnalysisRecord }) {
  const days = extractDays(record.ai_analysis);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-[var(--shadow-elevated)] transition">
      {/* Patient header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary text-base">{record.patient_name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                CONDITION_COLORS[record.condition_type] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {record.condition_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble size={11} />
              Bed {record.bed_number || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Admitted {timeAgo(record.sys_created_on)}
            </span>
          </div>
        </div>
        {/* Days badge */}
        {days && (
          <div className="shrink-0 flex flex-col items-center bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="text-lg font-bold text-purple-700 leading-none">{days}</span>
            <span className="text-[9px] text-purple-500 font-semibold mt-0.5">est. stay</span>
          </div>
        )}
      </div>

      {/* Diagnosis */}
      {record.nurse_diagnosis && (
        <div className="mb-3 text-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnosis: </span>
          <span className="text-foreground">{record.nurse_diagnosis}</span>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <BrainCircuit size={14} className="text-purple-600" />
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            AI Bed Analysis
          </span>
        </div>
        <p className="text-sm text-purple-900 leading-relaxed">{record.ai_analysis}</p>
      </div>
    </div>
  );
}

function AiAnalysisPage() {
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["aiAnalysis"],
    queryFn: () => getAiAnalysis(),
    refetchInterval: 30_000,
  });

  const records: AnalysisRecord[] = (data as { records?: AnalysisRecord[] })?.records ?? [];
  const isMock = (data as { source?: string })?.source === "mock";

  // Simple summary stats
  const avgDays =
    records.length === 0
      ? null
      : (() => {
          const nums = records.flatMap((r) => {
            const m = r.ai_analysis.match(/(\d+)/);
            return m ? [parseInt(m[1])] : [];
          });
          if (nums.length === 0) return null;
          return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
        })();

  return (
    <AppShell
      title="AI Analysis"
      breadcrumb={["Home", "AI Analysis"]}
      actions={
        <button
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["aiAnalysis"] });
            qc.invalidateQueries({ queryKey: ["patientAdmissions"] });
          }}
          className="inline-flex h-10 px-3 items-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Records with AI"
          value={records.length}
          icon={BrainCircuit}
          tone="accent"
        />
        <StatCard
          label="Avg Estimated Stay"
          value={avgDays ? `${avgDays} days` : "—"}
          icon={TrendingDown}
          tone="primary"
        />
        <StatCard
          label="Beds Freeing Soon"
          value={records.filter((r) => {
            const m = r.ai_analysis.match(/(\d+)/);
            return m && parseInt(m[1]) <= 3;
          }).length}
          icon={BedDouble}
          tone="success"
          sublabel="within 3 days"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-purple-600" />
          <h3 className="font-semibold text-secondary">
            Patient AI Predictions
          </h3>
          {isMock && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
              MOCK DATA
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      {/* How it works banner */}
      <div className="mb-5 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex gap-3">
        <BrainCircuit size={20} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-900">
          <span className="font-semibold">How this works:</span> When a nurse submits a diagnosis on the Admissions page,
          ServiceNow triggers a Business Rule that calls the AI (Mistral / Claude). The AI analyses the
          diagnosis and condition type, then estimates how many days the bed will remain occupied.
          The result is written back to the patient record and appears here automatically.
        </div>
      </div>

      {/* Cards grid */}
      {records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BrainCircuit size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No AI analysis available yet</p>
          <p className="text-sm mt-1">
            Go to <strong>Admissions</strong>, open a patient record, and submit a diagnosis.
            ServiceNow will trigger AI analysis automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {records.map((record) => (
            <AnalysisCard key={record.sys_id} record={record} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
