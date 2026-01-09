import type { VercelRequest, VercelResponse } from "vercel";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { type, subject, grade, count } = req.body;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Missing API_KEY");
    }

    let prompt = "";

    if (type === "questions") {
      prompt = `
Generate ${count || 10} MCQs for ${subject} Grade ${grade}.
Rules:
- 4 options
- include explanation
- output ONLY valid JSON array
`;
    } else if (type === "story") {
      prompt = `
Create a short "Choose Your Own Adventure" revision story for ${subject} Grade ${grade}.
Return valid JSON only.
`;
    } else {
      throw new Error("Invalid request type");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    return res.status(200).json(JSON.parse(text));
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
