// TanStack server functions wrapping ServiceNow. Fall back to mock data if not configured.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mockAssetCategories, mockAssetRequests, mockAssets, mockBeds, mockDashboard } from "./mock-data";

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { getSnConfig } = await import("./servicenow.server");
  const cfg = getSnConfig();
  if (!cfg) return { source: "mock" as const, ...mockDashboard };
  // Try ServiceNow; on any failure return mock so UI keeps working.
  try {
    const { snGetBeds } = await import("./servicenow.server");
    const beds = await snGetBeds(cfg);
    return { source: "servicenow" as const, ...mockDashboard, raw: { bedsCount: beds.result?.length ?? 0 } };
  } catch (e) {
    return { source: "mock" as const, error: (e as Error).message, ...mockDashboard };
  }
});

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

// Patient Admission — POSTs to x_1811536_hospit_0_patient_admission
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
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getSnConfig, snCreatePatientAdmission } = await import("./servicenow.server");
    const cfg = getSnConfig();
    // Build payload — only send fields that have a value
    const payload: Record<string, string> = {
      u_full_name:      data.fullName,
      u_age:            data.age,
      u_contact_number: data.contactNumber,
      u_gender:         data.gender,
    };
    if (data.bloodGroup)         payload.u_blood_group          = data.bloodGroup;
    if (data.emergencyContact)   payload.u_emergency_contact    = data.emergencyContact;
    if (data.referredBy)         payload.u_referred_by          = data.referredBy;
    if (data.insuranceAadhaarId) payload.u_insurance_aadhaar_id = data.insuranceAadhaarId;
    if (data.address)            payload.u_address               = data.address;

    if (!cfg) return { ok: true, source: "mock" as const, sysId: "mock-id", payload };
    const r = await snCreatePatientAdmission(cfg, payload);
    return { ok: true, source: "servicenow" as const, sysId: r.result?.sys_id ?? "", data: r };
  });
