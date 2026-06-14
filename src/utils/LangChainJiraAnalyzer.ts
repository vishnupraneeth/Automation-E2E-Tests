import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * LangChainJiraAnalyzer.ts
 * Drop into: src/utils/LangChainJiraAnalyzer.ts
 *
 * Install:
 *   npm install langchain @langchain/openai @langchain/core
 *
 * Add to .env:
 *   OPENAI_API_KEY=sk-...
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestFailureContext {
  testTitle: string;       // full title from titlePath()
  specFile: string;        // relative file path
  errorMessage: string;    // raw Playwright error string
  browser: string;         // e.g. "chromium"
  duration: number;        // ms
  retries: number;
  jiraIssueKey: string;    // e.g. "KAN-11" — already created by JiraReporter
  jiraBaseUrl: string;     // reused from JiraReporter — already validated
  jiraEmail: string;
  jiraApiToken: string;
}

interface AIAnalysis {
  rootCause: string;
  suggestedFix: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: "Assertion" | "Timeout" | "Element" | "Network" | "Config" | "Other";
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

export class LangChainJiraAnalyzer {

  /**
   * Called by JiraReporter immediately after a Jira issue is created.
   *
   * SAFETY GUARANTEES — none of these will ever throw to JiraReporter:
   *   • OPENAI_API_KEY missing       → skip, log warning
   *   • GPT-4o quota exhausted (429) → skip, log warning
   *   • OpenAI down / 15s timeout    → skip, log warning
   *   • GPT returns invalid JSON     → skip, log warning
   *   • Jira comment POST fails      → skip, log warning
   *
   * In every case the Jira ticket is already safely created and unaffected.
   */
  async analyzeAndComment(ctx: TestFailureContext): Promise<void> {
    // ── Guard 1: no API key → skip entirely ──────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[LangChain] ⚠️  OPENAI_API_KEY not set — skipping AI analysis");
      return;
    }

    try {
      console.log(`[LangChain] 🤖 Analyzing ${ctx.jiraIssueKey}...`);

      const analysis    = await this.analyzeFailure(ctx);
      const commentBody = this.formatComment(ctx, analysis);

      await this.postJiraComment(ctx, commentBody);

      console.log(`[LangChain] ✅ AI analysis posted to ${ctx.jiraIssueKey}`);

    } catch (err: unknown) {
      // ── Guard 2: quota exhausted — specific, clear message ───────────
      const status = (err as any)?.status ?? (err as any)?.response?.status;
      if (status === 429) {
        console.warn(
          `[LangChain] ⚠️  OpenAI quota exhausted — skipping AI comment on ${ctx.jiraIssueKey}. ` +
          `Jira ticket created successfully.`
        );
      } else {
        // ── Guard 3: any other error — log and move on ─────────────────
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[LangChain] ⚠️  AI analysis failed (non-blocking) for ${ctx.jiraIssueKey}: ${msg}. ` +
          `Jira ticket created successfully.`
        );
      }
      // NEVER rethrow — must not affect JiraReporter's catch block
    }
  }

  // ─── LangChain call ────────────────────────────────────────────────────────

  private async analyzeFailure(ctx: TestFailureContext): Promise<AIAnalysis> {
    const llm = new ChatOpenAI({
      model:       "gpt-4o",
      temperature: 0.2,     // low = consistent, factual output
      timeout:     15_000,  // 15 s max — never hold up the reporter
      apiKey:      process.env.OPENAI_API_KEY,
    });

    const response = await llm.invoke([
      new SystemMessage(`
        You are an expert QA engineer analyzing Playwright test failures.
        Respond ONLY with a valid JSON object — no markdown, no text outside JSON.
        Schema:
        {
          "rootCause":    "string (1–2 sentences)",
          "suggestedFix": "string (2–3 actionable sentences)",
          "severity":     "Low | Medium | High | Critical",
          "category":     "Assertion | Timeout | Element | Network | Config | Other"
        }
      `),
      new HumanMessage(`
        Analyze this Playwright test failure and return JSON only:

        Test:     ${ctx.testTitle}
        File:     ${ctx.specFile}
        Browser:  ${ctx.browser}
        Duration: ${ctx.duration}ms
        Retries:  ${ctx.retries}

        Error:
        ${ctx.errorMessage.slice(0, 1500)}
      `),
    ]);

    const text    = response.content as string;
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as AIAnalysis;
  }

  // ─── Comment formatter ─────────────────────────────────────────────────────

  private formatComment(ctx: TestFailureContext, a: AIAnalysis): string {
    const emoji: Record<AIAnalysis["severity"], string> = {
      Low:      "🟢",
      Medium:   "🟡",
      High:     "🟠",
      Critical: "🔴",
    };

    const durationSec = (ctx.duration / 1000).toFixed(2);
    const retryLabel  = `${ctx.retries} retr${ctx.retries === 1 ? "y" : "ies"}`;

    return [
      "🤖 AI Analysis — LangChain + GPT-4o",
      "",
      `Category : ${a.category}`,
      `Severity : ${emoji[a.severity]} ${a.severity}`,
      "",
      "Root Cause",
      a.rootCause,
      "",
      "Suggested Fix",
      a.suggestedFix,
      "",
      "---",
      `Analyzed automatically · ${ctx.browser} · ${durationSec}s · ${retryLabel}`,
    ].join("\n");
  }

  // ─── Jira comment POST (ADF format — same as JiraReporter uses) ───────────

  private async postJiraComment(ctx: TestFailureContext, body: string): Promise<void> {
    const url     = `${ctx.jiraBaseUrl}/rest/api/3/issue/${ctx.jiraIssueKey}/comment`;
    const auth    = Buffer.from(`${ctx.jiraEmail}:${ctx.jiraApiToken}`).toString("base64");

    const payload = JSON.stringify({
      body: {
        type:    "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: body }],
          },
        ],
      },
    });

    const res = await fetch(url, {
      method:  "POST",
      headers: {
        Authorization:  `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept:         "application/json",
      },
      body:   payload,
      signal: AbortSignal.timeout(10_000), // 10 s — don't hang on slow Jira
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Jira comment POST failed (HTTP ${res.status}): ${errText}`);
    }
  }
}
