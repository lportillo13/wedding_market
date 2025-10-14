const DEFAULT_MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";
const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

export type TranslateTextOptions = {
  text: string;
  sourceLanguageName: string;
  targetLanguageName: string;
};

export async function translateTextWithAI(options: TranslateTextOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("AI translation is not configured.");
  }

  const { text, sourceLanguageName, targetLanguageName } = options;
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("No text provided for translation.");
  }

  const endpoint = `${DEFAULT_BASE_URL.replace(/\/$/, "")}/responses`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are a professional translator. Return only the translated text without additional commentary or quotation marks.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}. Preserve the meaning, tone, and any numbers. Do not add extra explanations.\n\n${trimmed}`,
            },
          ],
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    let message = `Translation request failed with status ${response.status}.`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.error?.message === "string") {
        message = errorBody.error.message;
      }
    } catch {
      // Ignore JSON parse errors and fall back to generic message.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const outputText: unknown = payload?.output_text ?? payload?.output?.[0]?.content?.[0]?.text;

  if (typeof outputText !== "string") {
    throw new Error("Translation service did not return text.");
  }

  return outputText.trim();
}
