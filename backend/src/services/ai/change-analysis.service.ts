import { callOpenAiForJson } from "./openai-json.service.js";
import { buildChangeAnalysisPrompts } from "./prompts.js";

export type AiSeverity = "low" | "medium" | "high" | "critical";
export type AiPriority = "high" | "medium" | "low";
export type AiStatus = "pending" | "completed" | "failed";

export type AiChangeAnalysis = {
  version: "1.0";
  language: "es";
  summary: string;
  impactScore: number;
  severity: AiSeverity;
  confidence: number;
  keyChanges: Array<{
    category: string;
    description: string;
    evidence: string;
    impact: string;
  }>;
  businessImpact: {
    seo: string;
    messaging: string;
    ux: string;
    conversion: string;
  };
  recommendations: Array<{
    priority: AiPriority;
    action: string;
    reason: string;
  }>;
  riskFlags: string[];
  watchItems: string[];
};

type AnalyzeChangeInput = {
  competitorName: string;
  competitorDomain: string;
  requestedUrl: string;
  oldSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  newSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  changeSignals: {
    htmlChanged: boolean;
    visibleTextChanged: boolean;
    titleDiff: { from: string; to: string } | null;
    h1Diff: { from: string | null; to: string | null } | null;
    visibleTextDiff: { added: string[]; removed: string[] } | null;
  };
};

const CHANGE_ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "language",
    "summary",
    "impactScore",
    "severity",
    "confidence",
    "keyChanges",
    "businessImpact",
    "recommendations",
    "riskFlags",
    "watchItems",
  ],
  properties: {
    version: { type: "string", enum: ["1.0"] },
    language: { type: "string", enum: ["es"] },
    summary: { type: "string", minLength: 20, maxLength: 800 },
    impactScore: { type: "number", minimum: 0, maximum: 100 },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    keyChanges: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "description", "evidence", "impact"],
        properties: {
          category: { type: "string", minLength: 2, maxLength: 40 },
          description: { type: "string", minLength: 6, maxLength: 320 },
          evidence: { type: "string", minLength: 3, maxLength: 320 },
          impact: { type: "string", minLength: 6, maxLength: 320 },
        },
      },
    },
    businessImpact: {
      type: "object",
      additionalProperties: false,
      required: ["seo", "messaging", "ux", "conversion"],
      properties: {
        seo: { type: "string", minLength: 4, maxLength: 320 },
        messaging: { type: "string", minLength: 4, maxLength: 320 },
        ux: { type: "string", minLength: 4, maxLength: 320 },
        conversion: { type: "string", minLength: 4, maxLength: 320 },
      },
    },
    recommendations: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "action", "reason"],
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] },
          action: { type: "string", minLength: 6, maxLength: 320 },
          reason: { type: "string", minLength: 6, maxLength: 320 },
        },
      },
    },
    riskFlags: {
      type: "array",
      maxItems: 8,
      items: { type: "string", minLength: 3, maxLength: 200 },
    },
    watchItems: {
      type: "array",
      maxItems: 8,
      items: { type: "string", minLength: 3, maxLength: 200 },
    },
  },
};

function normalizeAnalysis(value: unknown): AiChangeAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const severity = v.severity;
  if (
    v.version !== "1.0" ||
    v.language !== "es" ||
    typeof v.summary !== "string" ||
    typeof v.impactScore !== "number" ||
    !["low", "medium", "high", "critical"].includes(String(severity))
  ) {
    return null;
  }

  const confidence =
    typeof v.confidence === "number" ? Math.max(0, Math.min(1, v.confidence)) : 0.5;
  const keyChanges = Array.isArray(v.keyChanges) ? v.keyChanges : [];
  const recommendations = Array.isArray(v.recommendations) ? v.recommendations : [];
  const businessImpact =
    v.businessImpact && typeof v.businessImpact === "object"
      ? (v.businessImpact as Record<string, unknown>)
      : {};

  return {
    version: "1.0",
    language: "es",
    summary: v.summary,
    impactScore: Math.max(0, Math.min(100, Number(v.impactScore))),
    severity: severity as AiSeverity,
    confidence,
    keyChanges: keyChanges
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const it = item as Record<string, unknown>;
        if (
          typeof it.category !== "string" ||
          typeof it.description !== "string" ||
          typeof it.evidence !== "string" ||
          typeof it.impact !== "string"
        ) {
          return null;
        }
        return {
          category: it.category,
          description: it.description,
          evidence: it.evidence,
          impact: it.impact,
        };
      })
      .filter(Boolean) as AiChangeAnalysis["keyChanges"],
    businessImpact: {
      seo: String(businessImpact.seo ?? "Sin datos"),
      messaging: String(businessImpact.messaging ?? "Sin datos"),
      ux: String(businessImpact.ux ?? "Sin datos"),
      conversion: String(businessImpact.conversion ?? "Sin datos"),
    },
    recommendations: recommendations
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const it = item as Record<string, unknown>;
        if (
          typeof it.action !== "string" ||
          typeof it.reason !== "string" ||
          !["high", "medium", "low"].includes(String(it.priority))
        ) {
          return null;
        }
        return {
          priority: it.priority as AiPriority,
          action: it.action,
          reason: it.reason,
        };
      })
      .filter(Boolean) as AiChangeAnalysis["recommendations"],
    riskFlags: Array.isArray(v.riskFlags)
      ? v.riskFlags.map((x) => String(x)).slice(0, 8)
      : [],
    watchItems: Array.isArray(v.watchItems)
      ? v.watchItems.map((x) => String(x)).slice(0, 8)
      : [],
  };
}

export async function analyzeChangeWithAi(input: AnalyzeChangeInput): Promise<{
  analysis: AiChangeAnalysis | null;
  model: string | null;
}> {
  const { systemPrompt, userPrompt } = buildChangeAnalysisPrompts(input);

  const raw = await callOpenAiForJson({
    systemPrompt,
    userPrompt,
    schemaName: "change_analysis_v1",
    schema: CHANGE_ANALYSIS_SCHEMA,
  });

  const normalized = normalizeAnalysis(raw?.content ?? null);
  return {
    analysis: normalized,
    model: raw?.model ?? null,
  };
}
