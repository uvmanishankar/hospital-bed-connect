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
