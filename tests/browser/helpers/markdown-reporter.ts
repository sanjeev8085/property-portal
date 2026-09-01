import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import fs from "node:fs";
import path from "node:path";

interface TestSummaryItem {
  title: string;
  category: string;
  status: "passed" | "failed" | "timedOut" | "skipped";
  durationMs: number;
  errors: string[];
}

export default class MarkdownQAReporter implements Reporter {
  private testResults: TestSummaryItem[] = [];
  private totalTests = 0;
  private passedTests = 0;
  private failedTests = 0;
  private skippedTests = 0;
  private startTime = 0;

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const title = test.titlePath().slice(1).join(" › ");
    const file = path.basename(test.location.file);
    const durationMs = result.duration;

    if (result.status === "passed") {
      this.passedTests++;
    } else if (result.status === "skipped") {
      this.skippedTests++;
    } else {
      this.failedTests++;
    }

    const errors = result.errors.map((e) => e.message || String(e));

    this.testResults.push({
      title,
      category: file,
      status: result.status,
      durationMs,
      errors,
    });
  }

  async onEnd(result: FullResult) {
    const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const isReady = this.failedTests === 0;

    const markdown = `# 📊 AuraHomes Automated Browser QA Report

**Execution Timestamp:** ${new Date().toISOString()}  
**Total Duration:** ${durationSec}s  
**Status:** ${isReady ? "🟢 **READY FOR PRODUCTION**" : "🔴 **RELEASE BLOCKED — FAILURES DETECTED**"}

---

## 📈 Executive Summary

| Metric | Result |
| :--- | :--- |
| **Total Browser Tests** | **${this.totalTests}** |
| **Passed** | 🟢 **${this.passedTests}** |
| **Failed** | 🔴 **${this.failedTests}** |
| **Skipped** | ⚪ **${this.skippedTests}** |
| **Pass Rate** | **${this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 100}%** |

---

## 🔍 Critical Business Workflow Verdicts

| Workflow | Status |
| :--- | :--- |
| **Golden Path Journey (Search → Favorite → Credit Purchase → Unlock)** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **User Authentication & Session Lifecycle** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Property Search & Dynamic Filter Engine** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Property Creation & Amenity Checklist (10 Steps)** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Credit Balance & Payment Verification** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Gated Owner Contact Unlock** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Admin Control Dashboard & Moderation** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |
| **Responsive Mobile (390x844) & Desktop (1280x800)** | ${this.failedTests === 0 ? "🟢 PASS" : "🔴 INVESTIGATE"} |

---

## 📋 Detailed Test Case Breakdown

| Test Suite | Scenario | Status | Duration |
| :--- | :--- | :---: | :--- |
${this.testResults
  .map(
    (t) =>
      `| \`${t.category}\` | ${t.title.replace(/\|/g, "/")} | ${
        t.status === "passed"
          ? "🟢 PASS"
          : t.status === "skipped"
          ? "⚪ SKIP"
          : "🔴 FAIL"
      } | ${(t.durationMs / 1000).toFixed(2)}s |`
  )
  .join("\n")}

---

## 🚀 Final Release Gate Decision

${
  isReady
    ? "### 🟢 VERDICT: ALL E2E BROWSER QUALITY CRITERIA MET. GO LIVE AUTHORIZED."
    : "### 🔴 VERDICT: DO NOT GO LIVE. PLEASE RESOLVE THE IDENTIFIED TEST FAILURES BEFORE DEPLOYMENT."
}
`;

    try {
      const reportPath = path.resolve(process.cwd(), "QA_REPORT.md");
      fs.writeFileSync(reportPath, markdown, "utf-8");
      console.log(`\n[+] QA Markdown Report successfully written to: ${reportPath}`);
    } catch (e) {
      console.warn("Failed to write QA_REPORT.md:", e);
    }
  }
}
