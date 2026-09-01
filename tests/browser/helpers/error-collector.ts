import { Page, TestInfo } from "@playwright/test";

export interface LoggedNetworkError {
  url: string;
  method: string;
  status: number;
  statusText: string;
}

export class ErrorCollector {
  private consoleErrors: string[] = [];
  private pageErrors: string[] = [];
  private networkErrors: LoggedNetworkError[] = [];

  constructor(private page: Page) {
    this.attachListeners();
  }

  private attachListeners() {
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore known harmless Next.js dev hydration / favicon warnings
        if (!text.includes("favicon.ico") && !text.includes("Turbopack")) {
          this.consoleErrors.push(text);
        }
      }
    });

    this.page.on("pageerror", (err) => {
      this.pageErrors.push(err.message || String(err));
    });

    this.page.on("response", (response) => {
      const status = response.status();
      // Track unexpected HTTP 500s or network failures
      if (status >= 500) {
        this.networkErrors.push({
          url: response.url(),
          method: response.request().method(),
          status: status,
          statusText: response.statusText(),
        });
      }
    });
  }

  getConsoleErrors(): string[] {
    return this.consoleErrors;
  }

  getPageErrors(): string[] {
    return this.pageErrors;
  }

  getNetworkErrors(): LoggedNetworkError[] {
    return this.networkErrors;
  }

  attachToTest(testInfo: TestInfo) {
    if (this.consoleErrors.length > 0) {
      testInfo.annotations.push({
        type: "console-errors",
        description: JSON.stringify(this.consoleErrors, null, 2),
      });
    }
    if (this.networkErrors.length > 0) {
      testInfo.annotations.push({
        type: "network-500-errors",
        description: JSON.stringify(this.networkErrors, null, 2),
      });
    }
  }
}
