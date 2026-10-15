
const MAX_PROMPT_CHARS = 18000;
const ALLOWED_MODES = new Set(["history", "evidence", "ask"]);

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Use POST for this endpoint." },
      { status: 405 }
    );
  }

  // Basic same-site browser check.
  const origin = request.headers.get("origin");
  const siteUrl = process.env.URL;

  if (origin && siteUrl) {
    try {
      if (new URL(origin).host !== new URL(siteUrl).host) {
        return Response.json(
          { error: "Request origin not allowed." },
          { status: 403 }
        );
      }
    } catch {
      return Response.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { mode, prompt } = body ?? {};

  if (!ALLOWED_MODES.has(mode)) {
    return Response.json(
      { error: "Unknown request type." },
      { status: 400 }
    );
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json(
      { error: "Please enter a question." },
      { status: 400 }
    );
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return Response.json(
      { error: "Please shorten your question." },
      { status: 413 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "GROQ_API_KEY is missing. Set it in your local environment or Netlify environment variables."
      },
      { status: 503 }
    );
  }

  const instructions = {
    history: `
You are a careful historian and historical geographer
specializing in Tamil Nadu and Tamil place names.

Explain the origin, historical development, and cultural
significance of the requested place. Never invent dates,
inscriptions, quotations, or sources. Distinguish established
facts from theories and explain uncertainty.

Follow the requested output format exactly.
If JSON is requested, return valid JSON only without
Markdown fences.
`,

    evidence: `
You are an evidence-focused researcher of Tamil history
and Tamil place names.

Use supplied sources for source-derived claims. Cite source
labels such as S1 or S2 when present. Never invent evidence,
dates, quotations, or sources. Separate supported facts
from interpretation and explain when evidence is insufficient.

Follow the requested output format exactly. Return valid
JSON only when JSON is requested.
`,

    ask: `
You are a helpful historian specializing in Tamil place names,
Tamil Nadu geography, and local history.

Answer directly in the language requested by the user.
Be clear and informative. Distinguish established facts
from uncertain claims. Never invent inscriptions,
quotations, sources, or exact dates.
`
  };

  // You can override this model using GROQ_MODEL.
  const model =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  

  try {
    const apiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: instructions[mode]
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens:
            mode === "history"
              ? 4500
              : mode === "evidence"
                ? 2500
                : 700,
          temperature: 0.4
        })
      }
    );

    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      const apiMessage =
        result?.error?.message ||
        "No detailed error was returned.";

      console.error(
        "Groq API error:",
        apiResponse.status,
        apiMessage
      );

      let message = `Groq API error (${apiResponse.status}): ${apiMessage}`;

      if (apiResponse.status === 401 || apiResponse.status === 403) {
        message =
          "Groq authentication failed. Check your API key and account access.";
      } else if (apiResponse.status === 429) {
        message =
          "Groq rate limit or quota reached. Check your Groq account limits and try again later.";
      }

      return Response.json(
        { error: message },
        { status: apiResponse.status === 429 ? 429 : 502 }
      );
    }

    const text =
      result?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      console.error("Groq returned an empty answer.");

      return Response.json(
        { error: "Groq returned an empty answer. Please try again." },
        { status: 502 }
      );
    }

    return Response.json({ text });

  } catch (error) {
    console.error(
      "Groq connection error:",
      error?.message || "Unknown error"
    );

    return Response.json(
      {
        error:
          "Could not connect to Groq. Check your internet connection and terminal output."
      },
      { status: 502 }
    );
  }
};

