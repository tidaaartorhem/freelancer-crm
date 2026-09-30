/**
 * AI provider abstraction for the pipeline assistant.
 *
 * The demo works with zero API keys via the built-in MockProvider.
 * Set AI_PROVIDER=openai|anthropic plus the matching key to use a real
 * (free-tier friendly) model. Nothing is ever sent automatically —
 * drafts land in the approval queue for human review first.
 */

export interface FollowUpContext {
  dealTitle: string;
  clientName: string;
  company?: string | null;
  dealValue: string;
  stage: "proposal" | "negotiation";
  daysSinceActivity: number;
  riskReasons: string[];
  lastActivitySummary?: string | null;
}

export interface DraftResult {
  subject: string;
  body: string;
}

export interface AIProvider {
  /** Stable id recorded on the draft, e.g. "mock", "openai". */
  id: string;
  model?: string;
  draftFollowUp(ctx: FollowUpContext): Promise<DraftResult>;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** Zero-key fallback: deterministic, template-based drafting. */
export class MockProvider implements AIProvider {
  readonly id = "mock";

  async draftFollowUp(ctx: FollowUpContext): Promise<DraftResult> {
    const name = firstName(ctx.clientName);
    const companyBit = ctx.company ? ` at ${ctx.company}` : "";
    const stageBit =
      ctx.stage === "proposal"
        ? "the proposal I sent over"
        : "where things stand on the project";
    const nudge =
      ctx.daysSinceActivity >= 14
        ? "I know things get busy — happy to walk through it live if that's easier than email."
        : "Would love your thoughts when you have a moment.";

    const subject = `Following up: ${ctx.dealTitle}`;
    const body = [
      `Hi ${name},`,
      ``,
      `Just checking in on ${stageBit} for ${ctx.dealTitle}${companyBit}.`,
      ctx.lastActivitySummary
        ? `Last we spoke, ${ctx.lastActivitySummary}`
        : undefined,
      ``,
      nudge,
      ``,
      `If priorities have shifted, no worries at all — just let me know and I'll close the loop on my end.`,
      ``,
      `Best,`,
      `Aadit`,
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    // Keep the mock honest: tiny artificial latency, no network.
    await new Promise((r) => setTimeout(r, 150));
    return { subject, body };
  }
}

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly model: string;
  private apiKey: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async draftFollowUp(ctx: FollowUpContext): Promise<DraftResult> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a freelance consultant's assistant. Write a short, warm, professional follow-up email. Reply with JSON: {\"subject\": string, \"body\": string}. Plain text body, no markdown, sign as Aadit.",
          },
          { role: "user", content: buildPrompt(ctx) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content) as DraftResult;
    if (!parsed.subject || !parsed.body) throw new Error("Bad model output");
    return parsed;
  }
}

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly model: string;
  private apiKey: string;

  constructor(apiKey: string, model = "claude-haiku-4-5") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async draftFollowUp(ctx: FollowUpContext): Promise<DraftResult> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        temperature: 0.6,
        system:
          "You are a freelance consultant's assistant. Write a short, warm, professional follow-up email. Reply with JSON only: {\"subject\": string, \"body\": string}. Plain text body, no markdown, sign as Aadit.",
        messages: [{ role: "user", content: buildPrompt(ctx) }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
    const data = await res.json();
    const text = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const parsed = JSON.parse(text) as DraftResult;
    if (!parsed.subject || !parsed.body) throw new Error("Bad model output");
    return parsed;
  }
}

function buildPrompt(ctx: FollowUpContext): string {
  return [
    `Deal: ${ctx.dealTitle} (${ctx.dealValue}, stage: ${ctx.stage})`,
    `Client: ${ctx.clientName}${ctx.company ? `, ${ctx.company}` : ""}`,
    `Days since last activity: ${ctx.daysSinceActivity}`,
    `Risk signals: ${ctx.riskReasons.join("; ") || "none"}`,
    ctx.lastActivitySummary ? `Last activity: ${ctx.lastActivitySummary}` : "",
    `Write a follow-up email that re-opens the conversation without sounding pushy.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getProvider(): AIProvider {
  const which = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (which === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(
      process.env.OPENAI_API_KEY,
      process.env.AI_MODEL || undefined
    );
  }
  if (which === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(
      process.env.ANTHROPIC_API_KEY,
      process.env.AI_MODEL || undefined
    );
  }
  return new MockProvider();
}
