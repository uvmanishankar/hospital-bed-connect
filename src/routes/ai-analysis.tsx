import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RefreshCw, TrendingDown, Clock, BedDouble, CheckCircle, XCircle } from "lucide-react";
import { AppShell, StatCard } from "@/components/AppShell";
import { getAiAnalysis } from "@/lib/servicenow.functions";

export const Route = createFileRoute("/ai-analysis")({
  head: () => ({ meta: [{ title: "AI Analysis — HospitalCare" }] }),
  component: AiAnalysisPage,
});

interface PredictionRecord {
  sys_id: string;
  patient_name: string;
  patient_age: string;
  condition_type: string;
  condition_notes: string;
  ai_analysis: string;
  estimated_days_min: string;
  estimated_days_max: string;
  ai_model: string;
  status: string;
  prediction_date: string;
  sys_created_on: string;
}

const CONDITION_COLORS: Record<string, string> = {
  critical:   "bg-red-100 text-red-800",
  emergency:  "bg-orange-100 text-orange-800",
  serious:    "bg-amber-100 text-amber-800",
  stable:     "bg-green-100 text-green-800",
  minor:      "bg-blue-100 text-blue-800",
  general:    "bg-teal-100 text-teal-800",
  icu:        "bg-red-100 text-red-800",
  paediatric: "bg-pink-100 text-pink-800",
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

function PredictionCard({ record }: { record: PredictionRecord }) {
  const daysMin = parseInt(record.estimated_days_min) || 0;
  const daysMax = parseInt(record.estimated_days_max) || 0;
  const daysLabel = daysMin && daysMax ? `${daysMin}–${daysMax}d` : daysMin ? `${daysMin}d` : null;
  const conditionKey = record.condition_type?.toLowerCase();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-[var(--shadow-elevated)] transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary text-base">{record.patient_name}</span>
            {record.patient_age && (
              <span className="text-xs text-muted-foreground">Age {record.patient_age}</span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                CONDITION_COLORS[conditionKey] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {record.condition_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {timeAgo(record.prediction_date || record.sys_created_on)}
            </span>
            {record.ai_model && (
              <span className="flex items-center gap-1">
                <BrainCircuit size={11} />
                {record.ai_model}
              </span>
            )}
          </div>
        </div>

        {/* Days badge */}
        {daysLabel && (
          <div className="shrink-0 flex flex-col items-center bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="text-lg font-bold text-purple-700 leading-none">{daysLabel}</span>
            <span className="text-[9px] text-purple-500 font-semibold mt-0.5">est. stay</span>
          </div>
        )}
      </div>

      {/* Condition notes */}
      {record.condition_notes && (
        <div className="mb-3 text-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Condition Notes:{" "}
          </span>
          <span className="text-foreground">{record.condition_notes}</span>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <BrainCircuit size={14} className="text-purple-600" />
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            AI Bed Prediction
          </span>
          <CheckCircle size={12} className="text-green-600 ml-auto" />
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

  const records: PredictionRecord[] = (data as { records?: PredictionRecord[] })?.records ?? [];
  const isMock = (data as { source?: string })?.source === "mock";

  const avgDays =
    records.length === 0
      ? null
      : (() => {
          const nums = records.flatMap((r) => {
            const v = parseInt(r.estimated_days_min);
            return isNaN(v) ? [] : [v];
          });
          if (nums.length === 0) return null;
          return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
        })();

  const freeSoon = records.filter((r) => {
    const v = parseInt(r.estimated_days_max || r.estimated_days_min);
    return !isNaN(v) && v <= 3;
  }).length;

  return (
    <AppShell
      title="AI Analysis"
      breadcrumb={["Home", "AI Analysis"]}
      actions={
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["aiAnalysis"] })}
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
          label="AI Predictions"
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
          value={freeSoon}
          icon={BedDouble}
          tone="success"
          sublabel="within 3 days"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-purple-600" />
          <h3 className="font-semibold text-secondary">Patient AI Predictions</h3>
          {isMock && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
              MOCK DATA
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      {/* Info banner */}
      <div className="mb-5 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex gap-3">
        <BrainCircuit size={20} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-900">
          <span className="font-semibold">How this works: </span>
          When a nurse updates <strong>condition notes</strong> on a Patient Admission,
          ServiceNow triggers a Business Rule that calls Mistral AI. The AI estimates
          bed occupancy days and clinical recommendations. Results are saved to the
          AI Prediction table and appear here automatically.
        </div>
      </div>

      {/* Cards */}
      {records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BrainCircuit size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No AI predictions yet</p>
          <p className="text-sm mt-1">
            Go to <strong>Admissions</strong>, open a patient record, and update the{" "}
            <strong>condition notes</strong>. ServiceNow will trigger AI analysis automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {records.map((record) => (
            <PredictionCard key={record.sys_id} record={record} />
          ))}
        </div>
      )}
    </AppShell>
  );
}