import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const { type, subject, grade, count } = JSON.parse(event.body);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Missing API_KEY");
    }

    let prompt = "";

    if (type === "questions") {
      prompt = `
Generate ${count || 10} multiple choice questions for ${subject} Grade ${grade}.
Rules:
- Exactly 4 options
- Include explanation
- Output ONLY valid JSON array
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        apiKey,
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text
    };
  } catch (err) {
    console.error("Gemini Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
