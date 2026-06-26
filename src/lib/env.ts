export async function loadEnv() {
  if (typeof process === "undefined") return;
  if (process.env.SERVICENOW_INSTANCE && process.env.SERVICENOW_USERNAME && process.env.SERVICENOW_PASSWORD) {
    return;
  }
  if (process.env.NODE_ENV === "production") return;

  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env" });
  } catch {
    // If dotenv isn't available or can't load, just continue.
  }
}
