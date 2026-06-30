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
      if (!res.ok) {
        // Surface ServiceNow's actual error payload (e.g. mandatory field, ACL,
        // or invalid field name) instead of a generic status code so failures
        // are visible in the UI toast instead of failing silently.
        let detail = "";
        try {
          const body = await res.json();
          detail =
            body?.error?.message ||
            body?.error?.detail ||
            JSON.stringify(body);
        } catch {
          detail = await res.text().catch(() => "");
        }
        throw new Error(`ServiceNow ${res.status} on ${init.method ?? "GET"} ${table}: ${detail}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("ServiceNow request failed");
}

export type SNRow = Record<string, string>;

// ─── Hospital beds — from bed_inventory scoped table ─────────────────────────
export async function snGetBeds(cfg: SNConfig) {
  return snFetch<{ result: SNRow[] }>(cfg, "x_1811536_hospit_0_bed_inventory", {
    query: {
      sysparm_limit: "500",
      sysparm_display_value: "true",
      sysparm_fields: [
        "sys_id",
        "number",
        "bed_number",
        "ward",
        "bed_type",
        "status",
        "patient_name",
        "patient_id",
        "age",
        "gender",
        "admitted_on",
        "diagnosis",
        "doctor",
        "expected_discharge",
        "rate_per_day",
        "sys_created_on",
        "sys_updated_on",
      ].join(","),
      sysparm_orderby: "ward",
    },
  });
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
        "condition_notes",
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
 * PATCH a single patient admission to record the nurse's condition notes.
 * The Business Rule on ServiceNow detects that condition_notes is now
 * non-blank and triggers the Mistral AI analysis call, writing the result
 * back into the ai_analysis field.
 *
 * Payload fields:
 *   condition_notes   – diagnosis, vitals, medications, observations
 *   nurse_submitted_by – (optional) sys_id of the logged-in nurse/employee.
 *     Some ServiceNow instances have this as a mandatory reference field on
 *     the form; pass it whenever the caller knows the logged-in user's sys_id
 *     so the PATCH doesn't fail validation on instances that enforce it.
 */
export async function snUpdatePatientCondition(
  cfg: SNConfig,
  sysId: string,
  body: { condition_notes: string; nurse_submitted_by?: string },
) {
  return snFetch<{ result: SNRow }>(cfg, "x_1811536_hospit_0_patient_admission", {
    method: "PATCH",
    id: sysId,
    body,
  });
}
// ─── Employee Authentication ──────────────────────────────────────────────────
// Looks up employee by number (e.g. EMPL1002) in the employee table,
// then validates the plain-text password field.
export async function snAuthenticateEmployee(
  cfg: SNConfig,
  employeeId: string,
  password: string,
) {
  // Correct truncated table name (ServiceNow 26-char limit)
  const tableNames = [
    "x_1811536_hospit_0_emplo",
  ];

  let result: { result: SNRow[] } | null = null;
  let lastError = "";

  for (const tableName of tableNames) {
    try {
      result = await snFetch<{ result: SNRow[] }>(cfg, tableName, {
        query: {
          sysparm_query: `number=${employeeId}`,
          sysparm_fields: "sys_id,number,first_name,last_name,role,email,password,active",
          sysparm_limit: "1",
          sysparm_display_value: "true",
        },
      });
      if (result.result !== undefined) break; // found the right table
    } catch (e) {
      lastError = (e as Error).message;
      result = null;
    }
  }

  if (!result || !result.result) {
    return { ok: false, error: "Could not find employee table. Error: " + lastError };
  }

  const employee = result.result?.[0];
  if (!employee)                    return { ok: false, error: "Employee ID not found" };
  if (employee.active === "false")  return { ok: false, error: "Account is inactive" };

  // ⚠️  SECURITY NOTE: ServiceNow stores employee passwords as plain text in this
  // custom table. A future improvement is to replace this with ServiceNow OAuth /
  // session-based auth so passwords are never transmitted or compared in plain text.
  // The comparison below is intentionally constant-time to avoid timing attacks.
  const suppliedBuf  = Buffer.from(password);
  const storedBuf    = Buffer.from(employee.password ?? "");
  const lengthsMatch = suppliedBuf.length === storedBuf.length;
  // Always run timingSafeEqual with equal-length buffers to prevent timing leaks.
  const padded = lengthsMatch
    ? storedBuf
    : Buffer.concat([storedBuf, Buffer.alloc(Math.max(0, suppliedBuf.length - storedBuf.length))]);
  const { timingSafeEqual } = await import("crypto");
  const passwordMatch = lengthsMatch && timingSafeEqual(suppliedBuf, padded);
  if (!passwordMatch) return { ok: false, error: "Incorrect password" };

  const { password: _pw, ...safeEmployee } = employee;
  return {
    ok: true,
    employee: {
      sys_id:      safeEmployee.sys_id,
      name:        `${safeEmployee.first_name} ${safeEmployee.last_name}`.trim(),
      email:       safeEmployee.email,
      employee_id: safeEmployee.number,
      role:        safeEmployee.role,
    },
  };
}