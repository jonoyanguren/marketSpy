import { env } from "../../config/env.js";
import OpenAI from "openai";

type OpenAiJsonArgs = {
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

type OpenAiJsonResult = {
  content: unknown;
  model: string;
};

export async function callOpenAiForJson({
  systemPrompt,
  userPrompt,
  schemaName,
  schema,
}: OpenAiJsonArgs): Promise<OpenAiJsonResult | null> {
  if (!env.openAiApiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey: env.openAiApiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model: env.openAiModel,
        max_tokens: env.aiMaxTokens,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        signal: controller.signal,
      },
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as unknown;
    return { content: parsed, model: response.model ?? env.openAiModel };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
