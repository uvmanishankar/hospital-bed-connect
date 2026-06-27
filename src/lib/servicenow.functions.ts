// TanStack server functions wrapping ServiceNow. Fall back to mock data if not configured.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mockAssetCategories, mockAssetRequests, mockAssets, mockBeds, mockDashboard } from "./mock-data";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig } = await import("./servicenow.server");
  const cfg = getSnConfig();
  if (!cfg) return { source: "mock" as const, ...mockDashboard };
  try {
    const { snGetBeds } = await import("./servicenow.server");
    const beds = await snGetBeds(cfg);
    return { source: "servicenow" as const, ...mockDashboard, raw: { bedsCount: beds.result?.length ?? 0 } };
  } catch (e) {
    return { source: "mock" as const, error: (e as Error).message, ...mockDashboard };
  }
});

// ─── Beds ─────────────────────────────────────────────────────────────────────
export const getBeds = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig } = await import("./servicenow.server");
  const cfg = getSnConfig();
  if (!cfg) return { source: "mock" as const, beds: mockBeds };
  try {
    const { snGetBeds } = await import("./servicenow.server");
    const r = await snGetBeds(cfg);
    return { source: "servicenow" as const, beds: r.result ?? [] };
  } catch {
    return { source: "mock" as const, beds: mockBeds };
  }
});

export const createBed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ ward: z.string(), number: z.string(), bedType: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snCreateBed } = await import("./servicenow.server");
    const cfg = getSnConfig();
    if (!cfg) return { ok: true, source: "mock" as const, data };
    const r = await snCreateBed(cfg, {
      u_ward: data.ward,
      u_number: data.number,
      u_bed_type: data.bedType,
      u_status: "available",
    });
    return { ok: true, source: "servicenow" as const, data: r };
  });

export const updateBed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string(), status: z.string().optional(), patient: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snUpdateBed } = await import("./servicenow.server");
    const cfg = getSnConfig();
    if (!cfg) return { ok: true, source: "mock" as const, data };
    const r = await snUpdateBed(cfg, data.id, {
      u_status: data.status,
      u_patient_name: data.patient,
    });
    return { ok: true, source: "servicenow" as const, data: r };
  });

// ─── Assets ───────────────────────────────────────────────────────────────────
export const getAssets = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig } = await import("./servicenow.server");
  const cfg = getSnConfig();
  if (!cfg) return { source: "mock" as const, assets: mockAssets, categories: mockAssetCategories, requests: mockAssetRequests };
  try {
    const { snGetAssets } = await import("./servicenow.server");
    const r = await snGetAssets(cfg);
    return { source: "servicenow" as const, assets: r.result ?? [], categories: mockAssetCategories, requests: mockAssetRequests };
  } catch {
    return { source: "mock" as const, assets: mockAssets, categories: mockAssetCategories, requests: mockAssetRequests };
  }
});

export const createAsset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ name: z.string(), type: z.string(), location: z.string(), model: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snCreateAsset } = await import("./servicenow.server");
    const cfg = getSnConfig();
    if (!cfg) return { ok: true, source: "mock" as const, data };
    const r = await snCreateAsset(cfg, {
      u_name: data.name,
      u_type: data.type,
      u_location: data.location,
      u_model: data.model,
      u_status: "available",
    });
    return { ok: true, source: "servicenow" as const, data: r };
  });

// ─── Legacy admission (u_bed_request) ────────────────────────────────────────
export const createAdmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      patientName: z.string(),
      ward: z.string(),
      diagnosis: z.string().optional(),
      priority: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snCreateAdmission } = await import("./servicenow.server");
    const cfg = getSnConfig();
    if (!cfg) return { ok: true, source: "mock" as const, data };
    const r = await snCreateAdmission(cfg, {
      u_patient_name: data.patientName,
      u_ward: data.ward,
      u_diagnosis: data.diagnosis,
      u_priority: data.priority ?? "normal",
      u_status: "pending",
    });
    return { ok: true, source: "servicenow" as const, data: r };
  });

// ─── Patient Admission — create ───────────────────────────────────────────────
// POSTs to x_1811536_hospit_0_patient_admission.
// All 9 fields from the "Patient Details" modal are sent directly to ServiceNow.
export const createPatientAdmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      fullName:           z.string().min(1, "Full name is required"),
      age:                z.string().min(1, "Age is required"),
      contactNumber:      z.string().min(1, "Contact number is required"),
      gender:             z.string().min(1, "Gender is required"),
      bloodGroup:         z.string().optional(),
      emergencyContact:   z.string().optional(),
      referredBy:         z.string().optional(),
      insuranceAadhaarId: z.string().optional(),
      address:            z.string().optional(),
      conditionType:      z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snCreatePatientAdmission } = await import("./servicenow.server");
    const cfg = getSnConfig();
    const payload: Record<string, string> = {
      patient_name:   data.fullName,
      patient_age:    data.age,
      phone_number:   data.contactNumber,
      gender:         data.gender,
    };
    if (data.bloodGroup)         payload.blood_group        = data.bloodGroup;
    if (data.emergencyContact)   payload.emergency_contact  = data.emergencyContact;
    if (data.referredBy)         payload.condition_notes    = data.referredBy;
    if (data.insuranceAadhaarId) payload.insurance_aadhaar  = data.insuranceAadhaarId;
    if (data.address)            payload.address             = data.address;
    if (data.conditionType)      payload.condition_type      = data.conditionType;

    if (!cfg) return { ok: true, source: "mock" as const, sysId: "mock-id", patientNumber: "PAT0001", payload };
    const r = await snCreatePatientAdmission(cfg, payload);
    return { ok: true, source: "servicenow" as const, sysId: r.result?.sys_id ?? "", patientNumber: r.result?.number ?? "", data: r };
  });

// ─── Patient Admission — list (for nurse's Admissions page) ──────────────────
// Returns all admission records from ServiceNow so nurses can see bed assignments.
// Falls back to empty array if ServiceNow is not configured.
export const getPatientAdmissions = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig, snGetPatientAdmissions } = await import("./servicenow.server");
  const cfg = getSnConfig();
  if (!cfg) {
    // Return illustrative mock records so the UI is usable without ServiceNow
    return {
      source: "mock" as const,
      admissions: [
        {
          sys_id: "mock-001",
          number: "PAD0001001",
          patient_name: "Anita Roy",
          patient_age: "34",
          gender: "Female",
          phone_number: "+91 98765 43210",
          condition_type: "Emergency",
          assigned_bed: "ICU-2A",
          nurse_diagnosis: "",
          nurse_notes: "",
          ai_analysis: "",
          sys_created_on: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          sys_id: "mock-002",
          number: "PAD0001002",
          patient_name: "Mahesh Kumar",
          patient_age: "58",
          gender: "Male",
          phone_number: "+91 98765 11111",
          condition_type: "General",
          assigned_bed: "GW-05",
          nurse_diagnosis: "Hypertension with mild oedema",
          nurse_notes: "BP monitored every 2h",
          ai_analysis: "Estimated bed occupancy: 4–5 days. Recommend daily BP monitoring and low-sodium diet. Discharge likely by Day 5 if BP stabilises.",
          sys_created_on: new Date(Date.now() - 80 * 60000).toISOString(),
        },
        {
          sys_id: "mock-003",
          number: "PAD0001003",
          patient_name: "Pooja Patel",
          patient_age: "8",
          gender: "Female",
          phone_number: "+91 77777 88888",
          condition_type: "Paediatric",
          assigned_bed: "PED-03",
          nurse_diagnosis: "",
          nurse_notes: "",
          ai_analysis: "",
          sys_created_on: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
      ],
    };
  }
  try {
    const r = await snGetPatientAdmissions(cfg);
    return { source: "servicenow" as const, admissions: r.result ?? [] };
  } catch (e) {
    return { source: "mock" as const, error: (e as Error).message, admissions: [] };
  }
});

// ─── Patient Admission — nurse condition update ───────────────────────────────
// PATCHes nurse_diagnosis + nurse_notes onto the record.
// The ServiceNow Business Rule / Script Include detects this and calls the AI,
// writing the result back into ai_analysis on the same record.
export const updatePatientCondition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      sysId:          z.string().min(1, "Record sys_id is required"),
      nurseDiagnosis: z.string().min(1, "Diagnosis is required"),
      nurseNotes:     z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snUpdatePatientCondition } = await import("./servicenow.server");
    const cfg = getSnConfig();
    if (!cfg) {
      // Mock: echo back so UI can optimistically update
      return {
        ok: true,
        source: "mock" as const,
        sysId: data.sysId,
        nurseDiagnosis: data.nurseDiagnosis,
        nurseNotes: data.nurseNotes ?? "",
      };
    }
    const r = await snUpdatePatientCondition(cfg, data.sysId, {
      nurse_diagnosis: data.nurseDiagnosis,
      nurse_notes:     data.nurseNotes ?? "",
    });
    return { ok: true, source: "servicenow" as const, sysId: data.sysId, data: r };
  });

// ─── AI Analysis — fetch from ServiceNow ─────────────────────────────────────
// Reads back the ai_analysis field for all admissions that already have it.
// Used by the /ai-analysis route to display the AI predictions panel.
export const getAiAnalysis = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig, snGetPatientAdmissions } = await import("./servicenow.server");
  const cfg = getSnConfig();

  if (!cfg) {
    return {
      source: "mock" as const,
      records: [
        {
          sys_id: "mock-002",
          patient_name: "Mahesh Kumar",
          condition_type: "Stable",
          assigned_bed: "GW-05",
          nurse_diagnosis: "Hypertension with mild oedema",
          ai_analysis: "Estimated bed occupancy: 4–5 days. Recommend daily BP monitoring and low-sodium diet. Discharge likely by Day 5 if BP stabilises.",
          sys_created_on: new Date(Date.now() - 80 * 60000).toISOString(),
        },
        {
          sys_id: "mock-ai-2",
          patient_name: "Vikram Singh",
          condition_type: "Emergency",
          assigned_bed: "ICU-1B",
          nurse_diagnosis: "Acute myocardial infarction post-angioplasty",
          ai_analysis: "High-risk patient. Estimated ICU stay: 7–10 days. Bed will remain occupied until cardiac markers normalise. Recommend daily echo follow-up.",
          sys_created_on: new Date(Date.now() - 3 * 3600000).toISOString(),
        },
      ],
    };
  }

  try {
    const r = await snGetPatientAdmissions(cfg);
    // Only surface records that have an ai_analysis
    const records = (r.result ?? []).filter((row) => row.ai_analysis && row.ai_analysis.trim() !== "");
    return { source: "servicenow" as const, records };
  } catch (e) {
    return { source: "mock" as const, error: (e as Error).message, records: [] };
  }
});