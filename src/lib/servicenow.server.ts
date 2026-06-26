// ServiceNow REST Table API connector (server-only).
// Tables:
//   u_hospital_bed, u_hospital_asset, u_bed_request, u_staff_availability
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

export async function snGetBeds(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_hospital_bed", { query: { sysparm_limit: "200" } });
}
export async function snCreateBed(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_bed", { method: "POST", body });
}
export async function snUpdateBed(cfg: SNConfig, id: string, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_bed", { method: "PATCH", id, body });
}
export async function snGetAssets(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_hospital_asset", { query: { sysparm_limit: "200" } });
}
export async function snCreateAsset(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_hospital_asset", { method: "POST", body });
}
export async function snCreateAdmission(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "u_bed_request", { method: "POST", body });
}
export async function snGetAdmissions(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_bed_request", { query: { sysparm_limit: "100" } });
}
export async function snGetStaffAvailability(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "u_staff_availability", { query: { sysparm_limit: "100" } });
}

// Patient Admission — table: x_1811536_hospit_0_patient_admission
// Field mapping:
//   u_full_name            → patient full name
//   u_age                  → patient age
//   u_contact_number       → contact number
//   u_gender               → gender
//   u_blood_group          → blood group
//   u_emergency_contact    → emergency contact name & number
//   u_referred_by          → referring doctor / hospital
//   u_insurance_aadhaar_id → insurance policy or Aadhaar ID
//   u_address              → full address
export async function snCreatePatientAdmission(cfg: SNConfig, body: Record<string, unknown>) {
  return snFetch<{ result: SNRow }>(cfg, "x_1811536_hospit_0_patient_admission", { method: "POST", body });
}

