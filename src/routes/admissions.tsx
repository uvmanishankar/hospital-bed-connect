import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ClipboardList, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatCard } from "@/components/AppShell";
import { createPatientAdmission } from "@/lib/servicenow.functions";

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
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState("Unknown");
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
      if (!response.ok) {
        throw new Error(`Overpass fetch failed: ${response.status}`);
      }
      const data = await response.json();
      const names = new Set<string>();
      for (const element of data.elements ?? []) {
        const name = element.tags?.name;
        if (typeof name === "string" && name.trim().length > 0) {
          names.add(name.trim());
        }
      }
      const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
      setAllHospitals(sorted);
      if (sorted.length === 0) {
        setHospitalFetchError("No hospitals found from Overpass.");
      }
    } catch (error) {
      setHospitalFetchError(
        error instanceof Error ? error.message : "Failed to load hospital list.",
      );
    } finally {
      setHospitalsLoading(false);
      setFirstHospFetch(true);
    }
  }

  function selectHospital(name: string) {
    setReferredBy(name);
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
      if (blurTimer.current != null) {
        window.clearTimeout(blurTimer.current);
      }
    };
  }, []);

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: {
      fullName: string;
      age: string;
      gender: string;
      contactNumber: string;
      bloodGroup: string;
      emergencyContact: string;
      referredBy: string;
      insuranceAadhaarId: string;
      address: string;
      conditionType: string;
    }) => createPatientAdmission({ data: input }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setName("");
      setDiag("");
      setAge("");
      setGender("");
      setContactNumber("");
      setBloodGroup("Unknown");
      setEmergencyContact("");
      setReferredBy("");
      setInsurance("");
      setAddress("");
      setConditionType("");

      if ((result as { source?: string }).source === "servicenow") {
        toast.success("Admission submitted to ServiceNow", {
          description: `Record created — Sys ID: ${(result as { sysId?: string }).sysId ?? "unknown"}`,
        });
      } else {
        toast.info("Saved in mock mode", {
          description: "ServiceNow env vars not set — record was not sent to ServiceNow.",
        });
      }
    },
    onError: (err: unknown) => {
      toast.error("Failed to submit admission", {
        description: err instanceof Error ? err.message : "Unknown error from ServiceNow.",
      });
    },
  });

  const recent = [
    {
      id: "REQ-BED-1021",
      patient: "Anita Roy",
      ward: "ICU - 2",
      status: "Pending",
      time: "10 min ago",
    },
    {
      id: "REQ-BED-1030",
      patient: "Mahesh Kumar",
      ward: "General Ward",
      status: "Approved",
      time: "20 min ago",
    },
    {
      id: "REQ-BED-1008",
      patient: "Pooja Patel",
      ward: "Pediatrics",
      status: "Pending",
      time: "1 hr ago",
    },
    {
      id: "REQ-BED-1007",
      patient: "Vikram Singh",
      ward: "ICU - 1",
      status: "In Progress",
      time: "2 hr ago",
    },
  ];

  return (
    <AppShell
      title="Admissions"
      breadcrumb={["Home", "Admissions"]}
      actions={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-[var(--shadow-glow)]"
        >
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
              <tr>
                {["Request ID", "Patient", "Ward", "Status", "Submitted"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/40">
                  <td className="py-3 px-2 font-semibold">{r.id}</td>
                  <td className="py-3 px-2">{r.patient}</td>
                  <td className="py-3 px-2">{r.ward}</td>
                  <td className="py-3 px-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-warning/15 text-amber-600">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                mutation.mutate({
                  fullName: name,
                  age,
                  gender,
                  contactNumber,
                  bloodGroup,
                  emergencyContact,
                  referredBy,
                  insuranceAadhaarId: insurance,
                  address,
                  conditionType,
                });
              }}
            >
              <div className="grid">
                <div className="group">
                  <label>
                    Full Name
                    <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manish Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label>
                    Age
                    <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label>
                    Gender
                    <span className="req">*</span>
                  </label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="group">
                  <label>
                    Contact Number
                    <span className="req">*</span>
                  </label>
                  <input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                <div className="group">
                  <label>
                    Condition Type
                    <span className="req">*</span>
                  </label>
                  <select value={conditionType} onChange={(e) => setConditionType(e.target.value)} required>
                    <option value="">Select condition type</option>
                    <option value="Critical">Critical</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Serious">Serious</option>
                    <option value="Stable">Stable</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>

                <div className="group">
                  <label>Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option>Unknown</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>

                <div className="group">
                  <label>Emergency Contact</label>
                  <input
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Name & number"
                  />
                </div>

                <div className="group" style={{ position: "relative" }}>
                  <label>Referred By</label>
                  <input
                    placeholder="Doctor name / Hospital"
                    value={referredBy}
                    onFocus={() => {
                      fetchHospitals();
                      setShowHospSuggestions(true);
                    }}
                    onChange={(e) => {
                      setReferredBy(e.target.value);
                      setShowHospSuggestions(true);
                    }}
                    onBlur={() => {
                      blurTimer.current = window.setTimeout(() => {
                        setShowHospSuggestions(false);
                      }, 150);
                    }}
                    onKeyDown={handleHospKeyDown}
                    ref={referredRef}
                    className="input"
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
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              selectHospital(h);
                            }}
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
                  <input
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    placeholder="Insurance policy"
                  />
                </div>

                <div className="group full">
                  <label>Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="footer">
                <button type="submit" disabled={mutation.isPending} className="btn">
                  {mutation.isPending ? "Submitting…" : "Submit Admission"}
                </button>
              </div>
              {mutation.isError && (
                <p className="text-xs text-destructive mt-2">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Failed to send admission to ServiceNow."}
                </p>
              )}
            </form>

            <style>{`
.patient-card {font-family: inherit}
.patient-card * {box-sizing: border-box}
.patient-card{background:#ffffff;border-radius:20px;overflow:hidden;max-width:900px;margin:auto;box-shadow:0 10px 30px rgba(0,0,0,.06);width:100%;max-height:80vh}
.patient-card .header{padding:20px;border-bottom:1px solid #e6edf5}
.patient-card .header h2{color:#10213b;font-size:22px;margin-bottom:4px}
.patient-card .header p{color:#6a7f98;font-size:13px}
.patient-card .form-area{padding:16px;max-height:calc(80vh - 120px);overflow:auto}
.patient-card .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.patient-card .group{display:flex;flex-direction:column}
.patient-card .full{grid-column:1/-1}
.patient-card label{font-size:16px;font-weight:600;margin-bottom:8px;color:#20334c}
.patient-card .req{color:red;margin-left:6px}
.patient-card input,.patient-card select{height:42px;border:2px solid #d7e2ee;border-radius:10px;padding:0 12px;font-size:15px;outline:none;background:white;transition:.2s}
.patient-card input:focus,.patient-card select:focus{border-color:#1f75b8;box-shadow:0 0 0 4px rgba(31,117,184,.15)}
.patient-card input::placeholder{color:#8192a8}
.patient-card .footer{display:flex;justify-content:flex-end;margin-top:12px;padding:12px}
.patient-card .btn{background:#0d5d93;color:white;border:none;padding:10px 18px;font-size:15px;font-weight:700;border-radius:10px;cursor:pointer;transition:.2s}
.patient-card .btn:hover{background:#094d78;transform:translateY(-2px)}
@media(max-width:850px){.patient-card .grid{grid-template-columns:1fr}}
.patient-card .hosp-suggestions{position:absolute;z-index:60;left:0;right:0;background:white;border:1px solid rgba(0,0,0,0.08);border-radius:8px;margin-top:6px;max-height:200px;overflow:auto;padding:0;list-style:none}
.patient-card .hosp-suggestions li{padding:8px 12px;border-bottom:1px solid rgba(0,0,0,0.03);cursor:pointer}
.patient-card .hosp-suggestions li.active{background:#eef6ff}
`}</style>
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