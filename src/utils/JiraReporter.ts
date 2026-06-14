import {
  Reporter,
  TestCase,
  TestResult,
  FullConfig,
  FullResult,
} from "@playwright/test/reporter";
import https from "https";
import http from "http";
import { URL } from "url";

/**
 * JiraReporter — Custom Playwright reporter that creates a Jira bug ticket
 * for every failed test.
 *
 * Configuration (via environment variables, loaded by playwright.config.ts):
 *   JIRA_BASE_URL     — e.g. https://yourcompany.atlassian.net
 *   JIRA_EMAIL        — Atlassian account email
 *   JIRA_API_TOKEN    — Atlassian API token
 *   JIRA_PROJECT_KEY  — Jira project key (e.g. KAN)
 */
export default class JiraReporter implements Reporter {
  private baseUrl: string = "";
  private email: string = "";
  private token: string = "";
  private projectKey: string = "";
  private auth: string = "";

  // Collect failures synchronously in onTestEnd; file bugs in onEnd
  private failures: Array<{ test: TestCase; result: TestResult }> = [];

  // Track created bug IDs for summary
  private createdIssues: Array<{ testTitle: string; issueKey: string; issueUrl: string }> = [];
  private failedIssues:  Array<{ testTitle: string; error: string }> = [];

  onBegin(_config: FullConfig): void {
    this.baseUrl    = (process.env.JIRA_BASE_URL ?? "").replace(/\/$/, "");
    this.email      = process.env.JIRA_EMAIL ?? "";
    this.token      = process.env.JIRA_API_TOKEN ?? "";
    this.projectKey = process.env.JIRA_PROJECT_KEY ?? "";
    this.auth       = Buffer.from(`${this.email}:${this.token}`).toString("base64");

    if (!this.baseUrl || !this.email || !this.token || !this.projectKey) {
      console.warn(
        "[JiraReporter] ⚠️  Missing one or more JIRA_* env variables. " +
          "Bug tickets will NOT be created."
      );
    } else {
      console.log(`[JiraReporter] ✅ Ready — will log bugs to ${this.projectKey} on failure`);
    }
  }

  // Synchronously collect failures — Playwright does NOT await async onTestEnd
  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "failed") {
      this.failures.push({ test, result });
    }
  }

  // Playwright awaits the Promise returned by onEnd — safe for async API calls
  async onEnd(_result: FullResult): Promise<void> {
    if (this.failures.length === 0 || !this.baseUrl) return;

    console.log(`\n[JiraReporter] 📋 Filing ${this.failures.length} Jira bug(s)...`);

    for (const { test, result } of this.failures) {
      const errorMessage =
        result.errors.map((e) => e.message ?? "").join("\n") || "Unknown error";
      const testTitle = test.titlePath().join(" > ");
      const testFile  = test.location.file.replace(process.cwd(), "");

      const summary     = `[Automation Bug] ${testTitle}`;
      const description = this.buildDescription(testTitle, testFile, errorMessage, result);

      try {
        const issueKey = await this.createJiraIssue(summary, description);
        const issueUrl = `${this.baseUrl}/browse/${issueKey}`;
        this.createdIssues.push({ testTitle, issueKey, issueUrl });
        // ✅ Print immediately so it appears in Jenkins logs right away
        process.stdout.write(`[JiraReporter] 🐞 Bug filed: ${issueKey}  →  ${issueUrl}\n`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.failedIssues.push({ testTitle, error: msg });
        process.stdout.write(`[JiraReporter] ❌ Failed to create Jira issue for "${testTitle}": ${msg}\n`);
      }
    }

    // ✅ Print a clear summary table so all bug IDs are visible in one place
    this.printSummary();

    // ✅ Give stdout a tick to fully flush before Playwright exits
    await new Promise((resolve) => setImmediate(resolve));
  }

  // ─── summary ───────────────────────────────────────────────────────────────

  private printSummary(): void {
    const divider = "─".repeat(72);
    process.stdout.write(`\n[JiraReporter] ${divider}\n`);
    process.stdout.write(`[JiraReporter] 📊  JIRA BUG SUMMARY\n`);
    process.stdout.write(`[JiraReporter] ${divider}\n`);

    if (this.createdIssues.length > 0) {
      process.stdout.write(`[JiraReporter] ✅  Created (${this.createdIssues.length}):\n`);
      for (const { issueKey, issueUrl, testTitle } of this.createdIssues) {
        process.stdout.write(`[JiraReporter]    🔑 ${issueKey}  |  ${testTitle}\n`);
        process.stdout.write(`[JiraReporter]       🔗 ${issueUrl}\n`);
      }
    }

    if (this.failedIssues.length > 0) {
      process.stdout.write(`[JiraReporter] ❌  Failed to create (${this.failedIssues.length}):\n`);
      for (const { testTitle, error } of this.failedIssues) {
        process.stdout.write(`[JiraReporter]    • ${testTitle}: ${error}\n`);
      }
    }

    process.stdout.write(`[JiraReporter] ${divider}\n\n`);
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  private buildDescription(
    title: string,
    file: string,
    error: string,
    result: TestResult
  ): object {
    return {
      version: 1,
      type: "doc",
      content: [
        this.adfHeading("Test Failure Details", 2),
        this.adfBulletList([
          `Test: ${title}`,
          `File: ${file}`,
          `Status: ${result.status}`,
          `Duration: ${(result.duration / 1000).toFixed(2)}s`,
          `Retries: ${result.retry}`,
        ]),
        this.adfHeading("Error Message", 3),
        this.adfCodeBlock(error),
        this.adfParagraph(
          "This ticket was automatically created by the Playwright JiraReporter."
        ),
      ],
    };
  }

  private adfHeading(text: string, level: number) {
    return {
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text }],
    };
  }

  private adfParagraph(text: string) {
    return {
      type: "paragraph",
      content: [{ type: "text", text }],
    };
  }

  private adfBulletList(items: string[]) {
    return {
      type: "bulletList",
      content: items.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      })),
    };
  }

  private adfCodeBlock(code: string) {
    return {
      type: "codeBlock",
      attrs: { language: "text" },
      content: [{ type: "text", text: code.slice(0, 2000) }],
    };
  }

  private createJiraIssue(
    summary: string,
    description: object
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        fields: {
          project:     { key: this.projectKey },
          summary,
          description,
          issuetype:   { name: "Task" },
        },
      });

      const parsed  = new URL(`${this.baseUrl}/rest/api/3/issue`);
      const options = {
        hostname: parsed.hostname,
        path:     parsed.pathname,
        method:   "POST",
        headers: {
          Authorization:    `Basic ${this.auth}`,
          "Content-Type":   "application/json",
          Accept:           "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      };

      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const json = JSON.parse(data);
            resolve(json.key as string);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }
}