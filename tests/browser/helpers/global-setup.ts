/**
 * Global setup — waits for the backend API to be reachable before test suite starts.
 * This prevents "Failed to fetch" flakiness caused by Render cold-start delays.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://aurahomes-backend-tz1c.onrender.com";
const HEALTH_ENDPOINT = `${BACKEND_URL}/api/v1/health`;
const MAX_WAIT_MS = 60_000; // 60 s max
const POLL_INTERVAL_MS = 2_000;

async function waitForBackend(): Promise<void> {
  const deadline = Date.now() + MAX_WAIT_MS;
  let lastError = "";

  console.log(`\n⏳  Waiting for backend to be reachable at ${HEALTH_ENDPOINT} …`);

  while (Date.now() < deadline) {
    try {
      const res = await fetch(HEALTH_ENDPOINT, { signal: AbortSignal.timeout(5000) });
      if (res.ok || res.status < 500) {
        console.log(`✅  Backend is up (HTTP ${res.status})\n`);
        return;
      }
      lastError = `HTTP ${res.status}`;
    } catch (err: any) {
      lastError = err.message;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  // Don't throw — allow tests to proceed and fail with meaningful messages
  console.warn(
    `⚠️  Backend did not respond within ${MAX_WAIT_MS / 1000}s (last error: ${lastError}). ` +
      `Tests may fail if backend is unreachable.\n`
  );
}

export default async function globalSetup(): Promise<void> {
  await waitForBackend();
}
