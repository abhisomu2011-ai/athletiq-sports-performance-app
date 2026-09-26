import { Router, type IRouter } from "express";

type RahulRequest = {
  message?: unknown;
  athlete?: {
    name?: unknown;
    sport?: unknown;
    level?: unknown;
    position?: unknown;
    goals?: unknown;
    preferences?: unknown;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const router: IRouter = Router();
const GEMINI_MODEL = "gemini-3-flash-preview";

router.post("/rahul/chat", async (req, res) => {
  const body = req.body as RahulRequest;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (message.length > 2000) {
    res.status(400).json({ error: "message is too long" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Rahul AI is not configured" });
    return;
  }

  const athlete = body.athlete ?? {};
  const context = [
    `Athlete name: ${typeof athlete.name === "string" ? athlete.name : "Athlete"}`,
    `Primary sport: ${typeof athlete.sport === "string" ? athlete.sport : "not set"}`,
    `Level: ${typeof athlete.level === "string" ? athlete.level : "not set"}`,
    `Position or event: ${typeof athlete.position === "string" ? athlete.position : "not set"}`,
    `Goals: ${Array.isArray(athlete.goals) ? athlete.goals.filter((goal): goal is string => typeof goal === "string").join(", ") || "not set" : "not set"}`,
    `Training preferences: ${Array.isArray(athlete.preferences) ? athlete.preferences.filter((preference): preference is string => typeof preference === "string").join(", ") || "not set" : "not set"}`,
  ].join("\n");

  const prompt = `You are Rahul, Athletiq's practical sports performance coach.

Give concise, actionable guidance for the athlete below. Be encouraging but direct. Suggest a concrete next step and avoid medical diagnosis, unsafe training advice, or pretending to have access to sensors, live data, or a real training history. If the athlete asks about injury, illness, or pain, recommend a qualified clinician.

${context}

Athlete question:
${message}`;

  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
          signal: AbortSignal.timeout(20000),
        },
      );

      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status) || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 502;
      const errorText = response ? await response.text() : "No response from Gemini";
      req.log?.error?.({ status, details: errorText.slice(0, 500) }, "Gemini Rahul request failed");
      res.status(502).json({ error: "Rahul could not answer right now" });
      return;
    }

    const result = (await response.json()) as GeminiResponse;
    const reply = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      res.status(502).json({ error: "Rahul returned an empty answer" });
      return;
    }

    res.json({ reply });
  } catch (error) {
    req.log?.error?.({ err: error }, "Rahul Gemini request failed");
    res.status(502).json({ error: "Rahul could not answer right now" });
  }
});

export default router;