// /api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { Grade, Subject } from '../../types';

// Make sure you set this in Vercel: GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({ apiKey });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, subject, grade, count } = req.body;

  try {
    if (type === "questions") {
      const prompt = `Generate ${count} ${subject} questions for grade ${grade} with options and correct answer. Format as JSON array of {id, question, options, correctAnswer, explanation}`;
      
      const response = await ai.generate({
        model: "gemini-1.5",
        type: Type.TEXT,
        prompt
      });

      const data = JSON.parse(response.output_text || "[]");
      return res.status(200).json(data);

    } else if (type === "story") {
      const prompt = `Generate a short ${subject} story for grade ${grade}.`;

      const response = await ai.generate({
        model: "gemini-1.5",
        type: Type.TEXT,
        prompt
      });

      return res.status(200).json({ story: response.output_text });
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "Failed to generate data" });
  }
}
