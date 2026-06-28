import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bed as BedIcon,
  Filter,
  Plus,
  X,
  Wrench,
  Lock,
  CheckCircle2,
  Users,
  ArrowRightLeft,
  UserMinus,
  Sparkles,
  AlertTriangle,
  UserPlus,
  Check,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatCard } from "@/components/AppShell";
import { getBeds } from "@/lib/servicenow.functions";
import { mockBeds, type Bed, type BedStatus } from "@/lib/mock-data";
import { allocateBedSchema, type AllocateBedFormData } from "@/lib/validation";
import { allocateBed, releaseBed, transferBed, markBedForCleaning } from "@/services/bedService";

// Patient → required bed type mapping. Drives allocation matching.
type PatientType = "critical" | "general" | "pediatric" | "maternity" | "infectious" | "post_op";
const PATIENT_TYPES: {
  value: PatientType;
  label: string;
  requires: string;
  description: string;
}[] = [
  {
    value: "critical",
    label: "Critical Care",
    requires: "ICU",
    description: "Needs ICU bed with ventilator support",
  },
  {
    value: "post_op",
    label: "Post-Operative",
    requires: "ICU",
    description: "Needs ICU / HDU monitoring bed",
  },
  {
    value: "general",
    label: "General / Ward",
    requires: "General",
    description: "Standard ward bed",
  },
  {
    value: "pediatric",
    label: "Pediatric",
    requires: "Pediatric",
    description: "Child-sized bed in pediatrics ward",
  },
  {
    value: "maternity",
    label: "Maternity",
    requires: "Maternity",
    description: "Maternity / labour bed",
  },
  {
    value: "infectious",
    label: "Infectious / Isolation",
    requires: "Isolation",
    description: "Isolation room with negative pressure",
  },
];

const bedsOpts = queryOptions({
  queryKey: ["beds"],
  queryFn: () => getBeds(),
});

export const Route = createFileRoute("/beds")({
  head: () => ({ meta: [{ title: "Bed Management — HospitalCare" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bedsOpts),
  component: BedsPage,
});

function BedsPage() {
  const { data } = useSuspenseQuery(bedsOpts);
  const rawBeds: Bed[] = useMemo(() => data.beds as Bed[], [data]);
  const [tab, setTab] = useState<"ward" | "list">("ward");
  const [ward, setWard] = useState("ICU");
  const [allocations, setAllocations] = useState<
    Record<string, { patient: string; type: PatientType }>
  >({});
  const beds: Bed[] = useMemo(
    () =>
      rawBeds.map((b) => {
        const a = allocations[b.id];
        if (!a || b.status !== "available") return b;
        return {
          ...b,
          status: "occupied" as BedStatus,
          patient: a.patient,
          patientId: `PT-NEW-${b.id}`,
          diagnosis: PATIENT_TYPES.find((p) => p.value === a.type)?.label,
          admittedOn: "Today",
        };
      }),
    [rawBeds, allocations],
  );
  const [selected, setSelected] = useState<Bed | null>(
    beds.find((b) => b.status === "occupied") ?? beds[0],
  );
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateTarget, setAllocateTarget] = useState<Bed | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByStatus, setFilterByStatus] = useState<BedStatus | "all">("all");
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const openAllocate = (bed: Bed | null) => {
    setAllocateTarget(bed);
    setAllocateOpen(true);
  };

  const handleAllocate = async (bedId: string, patient: string, type: PatientType) => {
    setIsLoadingAction(true);
    try {
      await allocateBed({ bedId, patientName: patient, patientType: type });
      setAllocations((a) => ({ ...a, [bedId]: { patient, type } }));
      setAllocateOpen(false);
      toast.success(`${patient} successfully allocated to ${bedId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to allocate bed");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDischargeBed = async (bedId: string) => {
    setIsLoadingAction(true);
    try {
      await releaseBed({ bedId });
      setAllocations((a) => {
        const updated = { ...a };
        delete updated[bedId];
        return updated;
      });
      setSelected(null);
      toast.success(`Bed ${bedId} discharged and marked as available`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to discharge bed");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleTransferBed = async (bedId: string, targetWard: string) => {
    setIsLoadingAction(true);
    try {
      await transferBed({ bedId, targetWard });
      toast.success(`Transfer initiated for ${bedId} to ${targetWard}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to transfer bed");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleMarkForCleaning = async (bedId: string) => {
    setIsLoadingAction(true);
    try {
      await markBedForCleaning(bedId);
      toast.success(`Bed ${bedId} marked for cleaning`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark bed for cleaning");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const wards: string[] = Array.from(new Set(beds.map((b) => b.ward.split("-")[0])));
  const visibleGroups = useMemo(() => {
    let filtered = beds.filter((b) => b.ward.startsWith(ward));

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.id.toLowerCase().includes(term) ||
          (b.patient && b.patient.toLowerCase().includes(term)),
      );
    }

    // Apply status filter
    if (filterByStatus !== "all") {
      filtered = filtered.filter((b) => b.status === filterByStatus);
    }

    const groups = new Map<string, Bed[]>();
    for (const b of filtered) {
      const list = groups.get(b.ward) ?? [];
      list.push(b);
      groups.set(b.ward, list);
    }
    return Array.from(groups.entries());
  }, [beds, ward, searchTerm, filterByStatus]);

  const counts = useMemo(
    () => ({
      total: beds.length,
      available: beds.filter((b) => b.status === "available").length,
      occupied: beds.filter((b) => b.status === "occupied").length,
      maintenance: beds.filter((b) => b.status === "maintenance").length,
      blocked: beds.filter((b) => b.status === "blocked").length,
    }),
    [beds],
  );

  return (
    <AppShell
      title="Beds"
      breadcrumb={["Home", "Beds"]}
      actions={
        <>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="cursor-pointer inline-flex h-10 px-4 items-center gap-2 rounded-xl border border-border bg-white text-sm font-semibold hover:bg-muted"
          >
            <Filter size={16} /> Filters {showFilters && "✕"}
          </button>
          <button
            onClick={() => openAllocate(null)}
            className="cursor-pointer inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)] hover:opacity-90"
          >
            <UserPlus size={16} /> Allocate Bed
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Beds"
          value={counts.total}
          sublabel="All Beds"
          icon={BedIcon}
          tone="info"
        />
        <StatCard
          label="Available Beds"
          value={counts.available}
          sublabel={`${Math.round((counts.available / counts.total) * 100)}% Available`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Occupied Beds"
          value={counts.occupied}
          sublabel={`${Math.round((counts.occupied / counts.total) * 100)}% Occupied`}
          icon={Users}
          tone="danger"
        />
        <StatCard
          label="Under Maintenance"
          value={counts.maintenance}
          sublabel="5% Maintenance"
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Blocked / Cleaning"
          value={counts.blocked}
          sublabel="1.6% Blocked"
          icon={Lock}
          tone="accent"
        />
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary">Filter Beds</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="cursor-pointer p-1 hover:bg-muted rounded-md text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary">
                Search by Bed ID or Patient
              </label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. ICU-1, John Doe"
                className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary">Filter by Status</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["all", "available", "occupied", "maintenance", "blocked"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterByStatus(status)}
                      className={`cursor-pointer text-xs font-medium py-2 px-3 rounded-lg border-2 transition capitalize ${filterByStatus === status ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"}`}
                    >
                      {status}
                    </button>
                  ),
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterByStatus("all");
              }}
              className="w-full h-9 text-xs font-semibold text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border">
            <div className="flex gap-6">
              {(["ward", "list"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`cursor-pointer pb-3 text-sm font-semibold capitalize ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "ward" ? "Ward View" : "List View"}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground">Select Ward</label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-white text-sm"
            >
              {wards.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {[
                { l: "Available", c: "bg-success" },
                { l: "Occupied", c: "bg-destructive" },
                { l: "Maintenance", c: "bg-warning" },
                { l: "Blocked", c: "bg-violet-500" },
              ].map((x) => (
                <span key={x.l} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${x.c}`} /> {x.l}
                </span>
              ))}
            </div>
          </div>

          {/* Beds grid */}
          {tab === "ward" ? (
            <div className="mt-5 space-y-6">
              {visibleGroups.map(([wardName, list]) => (
                <div key={wardName}>
                  <div className="text-sm font-semibold text-secondary mb-2">
                    {wardName} ({list.length} Beds)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {list.map((b) => (
                      <BedTile
                        key={b.id}
                        bed={b}
                        selected={selected?.id === b.id}
                        onSelect={() => setSelected(b)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    {["Bed", "Ward", "Status", "Patient", "Diagnosis", "Doctor", "Actions"].map(
                      (h) => (
                        <th key={h} className="text-left py-2 px-2 font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {beds
                    .filter((b) => b.ward.startsWith(ward))
                    .map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-border hover:bg-muted/40 cursor-pointer"
                        onClick={() => setSelected(b)}
                      >
                        <td className="py-2.5 px-2 font-semibold">{b.id}</td>
                        <td className="py-2.5 px-2">{b.ward}</td>
                        <td className="py-2.5 px-2">
                          <BedStatusBadge status={b.status} />
                        </td>
                        <td className="py-2.5 px-2">{b.patient ?? "—"}</td>
                        <td className="py-2.5 px-2">{b.diagnosis ?? "—"}</td>
                        <td className="py-2.5 px-2">{b.doctor ?? "—"}</td>
                        <td className="py-2.5 px-2">
                          <button className="cursor-pointer text-primary text-xs font-semibold hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bed details */}
        <BedDetails
          bed={selected}
          onClose={() => setSelected(null)}
          onAllocate={openAllocate}
          onDischarge={handleDischargeBed}
          onTransfer={handleTransferBed}
          onMarkCleaning={handleMarkForCleaning}
          isLoading={isLoadingAction}
        />
      </div>

      {allocateOpen && (
        <AllocateDialog
          beds={beds}
          target={allocateTarget}
          onClose={() => setAllocateOpen(false)}
          onConfirm={handleAllocate}
          isLoading={isLoadingAction}
        />
      )}
    </AppShell>
  );
}

function AllocateDialog({
  beds,
  target,
  onClose,
  onConfirm,
  isLoading,
}: {
  beds: Bed[];
  target: Bed | null;
  onClose: () => void;
  onConfirm: (bedId: string, patient: string, type: PatientType) => Promise<void>;
  isLoading?: boolean;
}) {
  const {
    watch,
    setValue,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AllocateBedFormData>({
    resolver: zodResolver(allocateBedSchema),
    defaultValues: {
      patient: "",
      type:
        target?.bedType === "ICU"
          ? "critical"
          : target?.bedType === "Pediatric"
            ? "pediatric"
            : target?.bedType === "Maternity"
              ? "maternity"
              : target?.bedType === "Isolation"
                ? "infectious"
                : "general",
      bedId: target?.id ?? "",
    },
  });

  const type = watch("type");
  const bedId = watch("bedId");
  const requirement = PATIENT_TYPES.find((p) => p.value === type)!;
  const availableForType = useMemo(
    () => beds.filter((b) => b.status === "available" && b.bedType === requirement.requires),
    [beds, requirement],
  );
  const targetBed = beds.find((b) => b.id === bedId) ?? null;
  const targetMismatch = !!(targetBed && targetBed.bedType !== requirement.requires);
  const targetUnavailable = !!(targetBed && targetBed.status !== "available");

  const isSubmitDisabled =
    isSubmitting || (isLoading ?? false) || targetMismatch || targetUnavailable;

  const onSubmit = async (data: AllocateBedFormData) => {
    await onConfirm(data.bedId, data.patient, data.type);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-secondary text-lg">Allocate Bed to Patient</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Patient type determines which bed types are eligible.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitDisabled}
            className="cursor-pointer p-1.5 hover:bg-muted rounded-md disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-secondary">Patient Name</label>
              <input
                {...register("patient")}
                placeholder="e.g. Riya Sharma"
                className={`mt-1 w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition ${
                  errors.patient
                    ? "border-destructive focus:ring-destructive/40"
                    : "border-border focus:ring-primary/40"
                }`}
              />
              {errors.patient && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.patient.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary">Patient Type</label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PATIENT_TYPES.map((p) => {
                  const active = type === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue("type", p.value)}
                      disabled={isSubmitDisabled}
                      className={`cursor-pointer text-left rounded-xl border-2 px-3 py-2.5 transition disabled:opacity-50 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-secondary">{p.label}</div>
                        {active && <Check size={14} className="text-primary" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {p.description}
                      </div>
                      <div className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">
                        Requires: {p.requires}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-secondary">Select Bed</label>
                <span className="text-[11px] text-muted-foreground">
                  {availableForType.length} compatible bed{availableForType.length === 1 ? "" : "s"}{" "}
                  available
                </span>
              </div>
              <select
                {...register("bedId")}
                className={`mt-1 w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition ${
                  errors.bedId
                    ? "border-destructive focus:ring-destructive/40"
                    : "border-border focus:ring-primary/40"
                }`}
              >
                <option value="">— Choose a bed —</option>
                {availableForType.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.bedType} · ₹{b.ratePerDay}/day
                  </option>
                ))}
                {targetBed && !availableForType.find((b) => b.id === targetBed.id) && (
                  <option value={targetBed.id}>
                    {targetBed.id} · {targetBed.bedType} · {targetBed.status}
                  </option>
                )}
              </select>

              {errors.bedId && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.bedId.message}
                </p>
              )}

              {targetMismatch && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/40 px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>{targetBed?.id}</strong> is a <strong>{targetBed?.bedType}</strong> bed
                    but a <strong>{requirement.label}</strong> patient requires a{" "}
                    <strong>{requirement.requires}</strong> bed. Pick a compatible bed above.
                  </span>
                </div>
              )}
              {targetUnavailable && !targetMismatch && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>{targetBed?.id}</strong> is currently {targetBed?.status} and cannot be
                    allocated.
                  </span>
                </div>
              )}
              {!targetBed && availableForType.length === 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    No available <strong>{requirement.requires}</strong> beds. Try a different
                    patient type or free up a bed.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitDisabled}
              className="cursor-pointer h-10 px-4 rounded-lg border border-border bg-white text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="cursor-pointer h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader size={14} className="animate-spin" /> Allocating...
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Allocate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BedTile({
  bed,
  selected,
  onSelect,
}: {
  bed: Bed;
  selected: boolean;
  onSelect: () => void;
}) {
  const styles: Record<
    BedStatus,
    { bg: string; border: string; icon: typeof BedIcon; iconC: string; text: string }
  > = {
    available: {
      bg: "bg-success/5",
      border: "border-success/40",
      icon: BedIcon,
      iconC: "text-success",
      text: "text-success",
    },
    occupied: {
      bg: "bg-destructive/5",
      border: "border-destructive/40",
      icon: BedIcon,
      iconC: "text-destructive",
      text: "text-destructive",
    },
    maintenance: {
      bg: "bg-warning/10",
      border: "border-warning/50",
      icon: Wrench,
      iconC: "text-amber-600",
      text: "text-amber-700",
    },
    blocked: {
      bg: "bg-violet-500/5",
      border: "border-violet-500/40",
      icon: Lock,
      iconC: "text-violet-600",
      text: "text-violet-700",
    },
  };
  const s = styles[bed.status];
  const Icon = s.icon;
  return (
    <button
      onClick={onSelect}
      className={`cursor-pointer relative text-left rounded-xl border-2 ${s.border} ${s.bg} px-3 py-3 transition hover:shadow-md ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <Icon size={18} className={`${s.iconC} mb-2`} />
      <div className={`text-xs font-bold ${s.text}`}>{bed.ward}</div>
      <div className={`text-lg font-extrabold ${s.text} tabular-nums leading-tight`}>
        {bed.number}
      </div>
      {bed.patient && (
        <div className="text-[10px] text-foreground/60 mt-1 truncate">{bed.patient}</div>
      )}
    </button>
  );
}

function BedStatusBadge({ status }: { status: BedStatus }) {
  const map: Record<BedStatus, string> = {
    available: "bg-success/15 text-success",
    occupied: "bg-destructive/10 text-destructive",
    maintenance: "bg-warning/15 text-amber-600",
    blocked: "bg-violet-500/10 text-violet-600",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${map[status]}`}
    >
      {status}
    </span>
  );
}

function BedDetails({
  bed,
  onClose,
  onAllocate,
  onDischarge,
  onTransfer,
  onMarkCleaning,
  isLoading,
}: {
  bed: Bed | null;
  onClose: () => void;
  onAllocate: (bed: Bed | null) => void;
  onDischarge?: (bedId: string) => Promise<void>;
  onTransfer?: (bedId: string, targetWard: string) => Promise<void>;
  onMarkCleaning?: (bedId: string) => Promise<void>;
  isLoading?: boolean;
}) {
  if (!bed)
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
        Select a bed to view details
      </div>
    );
  const rows: [string, string | number | undefined][] = [
    ["Patient Name", bed.patient],
    ["Patient ID", bed.patientId],
    [
      "Age / Gender",
      bed.age ? `${bed.age} Y / ${bed.gender === "M" ? "Male" : "Female"}` : undefined,
    ],
    ["Admitted On", bed.admittedOn],
    ["Diagnosis", bed.diagnosis],
    ["Attending Doctor", bed.doctor],
    ["Expected Discharge", bed.expectedDischarge],
    ["Bed Type", bed.bedType],
    ["Rate / Day", bed.ratePerDay ? `₹ ${bed.ratePerDay.toLocaleString()}` : undefined],
  ];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 self-start sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-secondary">Bed Details</h3>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="cursor-pointer p-1 hover:bg-muted rounded-md disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="font-bold text-secondary">
          {bed.ward} - Bed {bed.number}
        </div>
        <BedStatusBadge status={bed.status} />
      </div>
      <div className="mt-4 space-y-2.5 text-sm">
        {rows.map(
          ([k, v]) =>
            v && (
              <div key={k} className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-medium text-secondary text-right">{v}</div>
              </div>
            ),
        )}
      </div>
      <div className="mt-5">
        <div className="text-xs font-semibold text-secondary mb-2">Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {bed.status === "available" ? (
            <button
              onClick={() => onAllocate(bed)}
              disabled={isLoading}
              className="cursor-pointer h-10 rounded-lg bg-primary text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 col-span-2 hover:opacity-90 disabled:opacity-50 transition"
            >
              <UserPlus size={14} /> Allocate to Patient
            </button>
          ) : (
            <>
              <button
                onClick={() => onTransfer?.(bed.id, bed.ward)}
                disabled={isLoading}
                className="cursor-pointer h-10 rounded-lg bg-primary text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Loading
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={14} /> Transfer Bed
                  </>
                )}
              </button>
              <button
                onClick={() => onDischarge?.(bed.id)}
                disabled={isLoading}
                className="cursor-pointer h-10 rounded-lg bg-warning/15 text-amber-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-warning/25 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Loading
                  </>
                ) : (
                  <>
                    <UserMinus size={14} /> Discharge
                  </>
                )}
              </button>
              <button
                onClick={() => onMarkCleaning?.(bed.id)}
                disabled={isLoading}
                className="cursor-pointer h-10 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold inline-flex items-center justify-center gap-1.5 col-span-2 hover:bg-destructive/20 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Loading
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Mark for Cleaning
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-secondary">History</div>
          <a href="#" className="text-[10px] text-primary font-semibold">
            View All
          </a>
        </div>
        <div className="mt-2 space-y-2.5">
          <HistoryRow
            color="success"
            title="Assigned to Patient"
            when="21 May 2025, 10:30 AM"
            who="by Nurse Priya"
          />
          <HistoryRow
            color="info"
            title="Bed Allocated"
            when="21 May 2025, 10:25 AM"
            who="by System"
          />
        </div>
      </div>
    </div>
  );
}
function HistoryRow({
  color,
  title,
  when,
  who,
}: {
  color: "success" | "info";
  title: string;
  when: string;
  who: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${color === "success" ? "bg-success" : "bg-info"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-secondary">{title}</div>
        <div className="text-[10px] text-muted-foreground">
          {when} <span className="ml-1">{who}</span>
        </div>
      </div>
    </div>
  );
}