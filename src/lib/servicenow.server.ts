// ServiceNow REST Table API connector (server-only).
// Tables:
//   u_hospital_bed, u_hospital_asset, u_bed_request, u_staff_availability
//   x_1811536_hospit_0_patient_admission  ← patient admissions (scoped app)
//
// Auth: Basic auth with SERVICENOW_USERNAME / SERVICENOW_PASSWORD.
// Endpoint base: https://${SERVICENOW_INSTANCE}.service-now.com/api/now/table

export interface SNConfig {
  instance: string;
  username: string;
  password: string;
}

export function getSnConfig(): SNConfig | null {
  const instance = process.env.SERVICENOW_INSTANCE;
  const username = process.env.SERVICENOW_USERNAME;
  const password = process.env.SERVICENOW_PASSWORD;
  if (!instance || !username || !password) return null;
  return { instance, username, password };
}

function authHeader(cfg: SNConfig) {
  const token = btoa(`${cfg.username}:${cfg.password}`);
  return `Basic ${token}`;
}

function baseUrl(cfg: SNConfig) {
  const inst = cfg.instance.replace(/^https?:\/\//, "").replace(/\.service-now\.com$/, "");
  return `https://${inst}.service-now.com/api/now/table`;
}

async function snFetch<T = unknown>(
  cfg: SNConfig,
  table: string,
  init: { method?: string; query?: Record<string, string>; body?: unknown; id?: string } = {},
): Promise<T> {
  const url = new URL(`${baseUrl(cfg)}/${table}${init.id ? "/" + init.id : ""}`);
  if (init.query) for (const [k, v] of Object.entries(init.query)) url.searchParams.set(k, v);

  // basic retry (3 attempts on 429/5xx)
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        method: init.method ?? "GET",
        headers: {
          Authorization: authHeader(cfg),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`ServiceNow ${res.status}`);
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`ServiceNow ${res.status}: ${await res.text()}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("ServiceNow request failed");
}

export type SNRow = Record<string, string>;

// ─── Hospital beds ────────────────────────────────────────────────────────────
export async function snGetBeds(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_hospital_bed", { query: { sysparm_limit: "200" } });
}
export async function snCreateBed(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_bed", { method: "POST", body });
}
export async function snUpdateBed(cfg: SNConfig, id: string, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_bed", { method: "PATCH", id, body });
}

// ─── Hospital assets ──────────────────────────────────────────────────────────
export async function snGetAssets(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_hospital_asset", { query: { sysparm_limit: "200" } });
}
export async function snCreateAsset(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_asset", { method: "POST", body });
}

// ─── Bed requests (legacy) ────────────────────────────────────────────────────
export async function snCreateAdmission(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_bed_request", { method: "POST", body });
}
export async function snGetAdmissions(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_bed_request", { query: { sysparm_limit: "100" } });
}

// ─── Staff availability ───────────────────────────────────────────────────────
export async function snGetStaffAvailability(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_staff_availability", { query: { sysparm_limit: "100" } });
}

// ─── Patient Admission (scoped app table) ─────────────────────────────────────
// Table: x_1811536_hospit_0_patient_admission
// Core fields (no u_ prefix):
//   patient_name, patient_age, phone_number, gender,
//   blood_group, emergency_contact, condition_notes, insurance_aadhaar, address,
//   condition_type, bed_number (written by Business Rule after auto-assign),
//   nurse_diagnosis, nurse_notes, ai_analysis  ← added for nurse update + AI
export async function snCreatePatientAdmission(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "x_1811536_hospit_0_patient_admission", { method: "POST", body });
}

/**
 * GET all patient admissions.  Fetches selected fields so the nurse's
 * Admissions page can show the live patient list with bed assignments.
 *
 * Fields requested:
 *   sys_id, patient_name, patient_age, gender, phone_number,
 *   condition_type, bed_number, nurse_diagnosis, nurse_notes,
 *   ai_analysis, sys_created_on
 */
export async function snGetPatientAdmissions(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "x_1811536_hospit_0_patient_admission", {
    query: {
      sysparm_limit: "100",
      sysparm_display_value: "true",
      sysparm_fields: [
        "sys_id",
        "number",
        "patient_name",
        "patient_age",
        "gender",
        "phone_number",
        "condition_type",
        "assigned_bed",
        "nurse_diagnosis",
        "nurse_notes",
        "ai_analysis",
        "sys_created_on",
      ].join(","),
      sysparm_orderby: "sys_created_on",
      sysparm_order_direction: "desc",
    },
  });
}

/**
 * GET all AI Predictions from the dedicated AI Prediction table.
 * Table: x_1811536_hospit_0_ai_prediction
 */
export async function snGetAiPredictions(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "x_1811536_hospit_0_ai_prediction", {
    query: {
      sysparm_limit: "100",
      sysparm_display_value: "true",
      sysparm_fields: [
        "sys_id",
        "number",
        "patient_name",
        "patient_age",
        "condition_type",
        "condition_notes",
        "ai_analysis",
        "ai_model",
        "estimated_days_min",
        "estimated_days_max",
        "status",
        "active",
        "prediction_date",
        "sys_created_on",
      ].join(","),
      sysparm_orderby: "sys_created_on",
      sysparm_order_direction: "desc",
      sysparm_query: "status=completed^active=true",
    },
  });
}

/**
 * PATCH a single patient admission to record the nurse's post-diagnosis update.
 * The Business Rule / Script Include on the ServiceNow side will detect that
 * nurse_diagnosis is now populated and trigger the AI analysis call, writing
 * the result back into the ai_analysis field.
 *
 * Payload fields:
 *   nurse_diagnosis  – doctor's diagnosis string
 *   nurse_notes      – additional nurse notes / observations
 */
export async function snUpdatePatientCondition(
  cfg: SNConfig,
  sysId: string,
  body: { nurse_diagnosis: string; nurse_notes?: string },
) {
  return snFetch<{ result: SNRow }>(cfg, "x_1811536_hospit_0_patient_admission", {
    method: "PATCH",
    id: sysId,
    body,
  });
}