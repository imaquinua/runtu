// ============================================
// Test Script - Proactive Intelligence Features
// ============================================
// Run: npx ts-node scripts/test-proactive.ts
//
// Prerequisites:
// - .env.local configured
// - Database with test user
// - npm install dotenv

import { config } from "dotenv";
config({ path: ".env.local" });

// ============================================
// Types
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface Summary {
  id: string;
  content: string;
  highlights: string[];
}

interface Alert {
  id: string;
  type: string;
  priority: string;
  title: string;
}

interface Report {
  id: string;
  title: string;
  content: string;
}

// ============================================
// Test Configuration
// ============================================

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || "";

// ============================================
// Helper Functions
// ============================================

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
      Cookie: `sb-access-token=${TEST_AUTH_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function log(message: string, type: "info" | "success" | "error" = "info"): void {
  const prefix = {
    info: "ℹ️ ",
    success: "✅",
    error: "❌",
  }[type];
  console.log(`${prefix} ${message}`);
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    log(`${name} (${duration}ms)`, "success");
    return { name, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`${name}: ${errorMessage}`, "error");
    return { name, passed: false, error: errorMessage, duration };
  }
}

// ============================================
// Summary Tests
// ============================================

async function testSummaryGeneration(): Promise<void> {
  // Test manual summary generation
  const response = await fetchApi<{ summary: Summary }>("/api/summaries", {
    method: "POST",
    body: JSON.stringify({
      type: "weekly",
      forceRegenerate: true,
    }),
  });

  assert(response.summary !== undefined, "Summary was generated");
  assert(response.summary.content.length > 50, "Summary has meaningful content");
}

async function testSummaryList(): Promise<void> {
  const response = await fetchApi<{ summaries: Summary[] }>("/api/summaries");

  assert(Array.isArray(response.summaries), "Summaries is an array");
}

async function testSummaryMarkAsRead(): Promise<void> {
  // First get summaries
  const listResponse = await fetchApi<{ summaries: Summary[] }>("/api/summaries");

  if (listResponse.summaries.length === 0) {
    log("No summaries to test mark as read - skipping", "info");
    return;
  }

  const summaryId = listResponse.summaries[0].id;

  // Mark as read
  await fetchApi(`/api/summaries/${summaryId}`, {
    method: "PATCH",
  });
}

// ============================================
// Alert Tests
// ============================================

async function testAlertsList(): Promise<void> {
  const response = await fetchApi<{ alerts: Alert[] }>("/api/alerts");

  assert(Array.isArray(response.alerts), "Alerts is an array");
}

async function testAlertMarkSeen(): Promise<void> {
  const listResponse = await fetchApi<{ alerts: Alert[] }>("/api/alerts");

  if (listResponse.alerts.length === 0) {
    log("No alerts to test mark seen - skipping", "info");
    return;
  }

  const alertId = listResponse.alerts[0].id;

  await fetchApi(`/api/alerts/${alertId}`, {
    method: "PATCH",
  });
}

async function testAlertDismiss(): Promise<void> {
  const listResponse = await fetchApi<{ alerts: Alert[] }>("/api/alerts");

  if (listResponse.alerts.length === 0) {
    log("No alerts to test dismiss - skipping", "info");
    return;
  }

  const alertId = listResponse.alerts[0].id;

  await fetchApi(`/api/alerts/${alertId}`, {
    method: "DELETE",
  });
}

// ============================================
// Report Tests
// ============================================

async function testReportGeneration(): Promise<void> {
  const response = await fetchApi<{ report: Report }>("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      type: "executive",
      period: "last_week",
    }),
  });

  assert(response.report !== undefined, "Report was generated");
  assert(response.report.title.length > 0, "Report has title");
}

async function testReportList(): Promise<void> {
  const response = await fetchApi<{ reports: Report[] }>("/api/reports");

  assert(Array.isArray(response.reports), "Reports is an array");
}

async function testReportDownload(): Promise<void> {
  const listResponse = await fetchApi<{ reports: Report[] }>("/api/reports");

  if (listResponse.reports.length === 0) {
    log("No reports to test download - skipping", "info");
    return;
  }

  const reportId = listResponse.reports[0].id;

  // Test HTML download
  const response = await fetch(`${BASE_URL}/api/reports/${reportId}?format=html`, {
    headers: {
      Authorization: `Bearer ${TEST_AUTH_TOKEN}`,
    },
  });

  assert(response.ok, "Download request succeeded");
  assert(
    response.headers.get("content-type")?.includes("text/html") ?? false,
    "Response is HTML"
  );
}

async function testReportDelete(): Promise<void> {
  // First generate a test report
  const createResponse = await fetchApi<{ report: Report }>("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      type: "executive",
      period: "last_week",
    }),
  });

  const reportId = createResponse.report.id;

  // Delete it
  await fetchApi(`/api/reports/${reportId}`, {
    method: "DELETE",
  });
}

// ============================================
// Integration Tests
// ============================================

async function testChatReportIntent(): Promise<void> {
  const response = await fetchApi<{ content: string; report?: Report }>(
    "/api/chat",
    {
      method: "POST",
      body: JSON.stringify({
        message: "genera un reporte ejecutivo del mes pasado",
      }),
    }
  );

  // Either the report was generated or there's a response about it
  assert(
    response.report !== undefined || response.content.toLowerCase().includes("reporte"),
    "Chat handled report intent"
  );
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests(): Promise<void> {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("           RUNTU - Proactive Intelligence Test Suite           ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("\n");

  const results: TestResult[] = [];

  // Summary Tests
  console.log("📋 SUMMARIES");
  console.log("─────────────────────────────────────────────────");
  results.push(await runTest("Summary List", testSummaryList));
  results.push(await runTest("Summary Generation", testSummaryGeneration));
  results.push(await runTest("Summary Mark as Read", testSummaryMarkAsRead));
  console.log("");

  // Alert Tests
  console.log("🔔 ALERTS");
  console.log("─────────────────────────────────────────────────");
  results.push(await runTest("Alerts List", testAlertsList));
  results.push(await runTest("Alert Mark Seen", testAlertMarkSeen));
  results.push(await runTest("Alert Dismiss", testAlertDismiss));
  console.log("");

  // Report Tests
  console.log("📊 REPORTS");
  console.log("─────────────────────────────────────────────────");
  results.push(await runTest("Reports List", testReportList));
  results.push(await runTest("Report Generation", testReportGeneration));
  results.push(await runTest("Report Download", testReportDownload));
  results.push(await runTest("Report Delete", testReportDelete));
  console.log("");

  // Integration Tests
  console.log("🔗 INTEGRATION");
  console.log("─────────────────────────────────────────────────");
  results.push(await runTest("Chat Report Intent", testChatReportIntent));
  console.log("");

  // Summary
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                          RESULTS                              ");
  console.log("═══════════════════════════════════════════════════════════════");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms\n`);

  if (failed > 0) {
    console.log("Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    console.log("");
  }

  const status = failed === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED";
  console.log(status);
  console.log("\n");

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
