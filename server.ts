import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

type RahulRequest = {
  message?: string;
  athlete?: {
    name?: string;
    sport?: string;
    level?: string;
    position?: string;
    goals?: string[];
    preferences?: string[];
  };
};

function generateFallbackGuidance(message: string, athlete: RahulRequest["athlete"] = {}): string {
  const sport = athlete.sport || "Football";
  const name = athlete.name || "Athlete";
  const level = athlete.level || "Intermediate";
  const position = athlete.position || "player";
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("what should i train") || lowerMsg.includes("train today") || lowerMsg.includes("workout")) {
    return `Hey ${name}! For ${sport} at the ${level} level (${position}), focus on a high-intent 30-minute block today:\n\n1. 5 min dynamic warmup (ankle rockers & hip lock march)\n2. 15 min sport-specific mechanics: first-step acceleration & reactive footwork\n3. 10 min quality reps and cool-down breathing.\n\nKeep the intensity crisp and stop one rep before your form breaks down.`;
  }

  if (lowerMsg.includes("recover") || lowerMsg.includes("sore") || lowerMsg.includes("rest") || lowerMsg.includes("sleep")) {
    return `Recovery is where adaptations happen, ${name}. Here is your recovery protocol:\n\n1. Downshift: 5 minutes of box breathing (4s in, 4s hold, 4s out, 4s hold).\n2. Mobility: 90/90 hip flow and hamstring floss.\n3. Fuel & Hydration: Drink 500ml water with a pinch of electrolytes, and aim for 8+ hours of sleep tonight.`;
  }

  if (lowerMsg.includes("eat") || lowerMsg.includes("nutrition") || lowerMsg.includes("diet") || lowerMsg.includes("food") || lowerMsg.includes("protein")) {
    return `For ${sport} training, build your plate around the session:\n\n• 1/2 plate complex carbohydrates (rice, roti, oats, or sweet potatoes) for fuel\n• 1/4 plate clean protein (dal, paneer, eggs, chicken, or curd) for tissue repair\n• 1/4 plate greens and healthy fats\n\nHydrate with 2–3 litres through the day and add a squeeze of lemon after heavy sweat sessions.`;
  }

  return `Hey ${name}, as a ${sport} ${position} (${level}), consistency is your biggest competitive edge. Regarding "${message}": keep your volume controlled, prioritize repeatable mechanics over sheer fatigue, and log every session in your streak. What specific drill or metric would you like to dial in next?`;
}

// Rahul AI Coach endpoint
app.post("/api/rahul/chat", async (req: Request, res: Response) => {
  const body = req.body as RahulRequest;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const athlete = body.athlete || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallbackReply = generateFallbackGuidance(message, athlete);
    res.json({ reply: fallbackReply });
    return;
  }

  const context = [
    `Athlete name: ${athlete.name || "Athlete"}`,
    `Primary sport: ${athlete.sport || "not set"}`,
    `Level: ${athlete.level || "not set"}`,
    `Position or event: ${athlete.position || "not set"}`,
    `Goals: ${Array.isArray(athlete.goals) ? athlete.goals.join(", ") : "not set"}`,
    `Training preferences: ${Array.isArray(athlete.preferences) ? athlete.preferences.join(", ") : "not set"}`,
  ].join("\n");

  const prompt = `You are Rahul, Athletiq's practical sports performance coach.

Give concise, actionable guidance for the athlete below. Be encouraging but direct. Suggest a concrete next step and avoid medical diagnosis, unsafe training advice, or pretending to have access to sensors, live data, or a real training history. If the athlete asks about injury, illness, or pain, recommend a qualified clinician.

${context}

Athlete question:
${message}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const fallbackReply = generateFallbackGuidance(message, athlete);
      res.json({ reply: fallbackReply });
      return;
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const reply = result.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();

    if (!reply) {
      const fallbackReply = generateFallbackGuidance(message, athlete);
      res.json({ reply: fallbackReply });
      return;
    }

    res.json({ reply });
  } catch (error) {
    console.error("Gemini request error, falling back to local coach:", error);
    const fallbackReply = generateFallbackGuidance(message, athlete);
    res.json({ reply: fallbackReply });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const clientRoot = path.resolve(__dirname, "artifacts/athletiq");

  if (!isProd) {
    const vite = await createViteServer({
      root: clientRoot,
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(clientRoot, "dist/public");
    app.use(express.static(distPath));
    app.use("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, host, () => {
    console.log(`Athletiq running on http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
