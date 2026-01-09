
import { Grade, Subject } from "../types";

const API_URL = "/api/gemini";

const FALLBACK_QUESTIONS: Record<string, any[]> = {
  [Subject.ENGLISH]: [
    {
      id: "e1",
      question: "Identify the figure of speech: 'The wind whispered through the trees'.",
      options: ["Simile", "Metaphor", "Personification", "Alliteration"],
      correctAnswer: "Personification",
      explanation: "Giving human qualities to non-living things is personification."
    }
  ],
  [Subject.HINDI]: [
    {
      id: "h1",
      question: "सूरदास की प्रसिद्ध रचना कौन सी है?",
      options: ["साकेत", "सूरसागर", "कामायनी", "यशोधरा"],
      correctAnswer: "सूरसागर",
      explanation: "सूरसागर सूरदास की प्रसिद्ध रचना है।"
    }
  ],
  [Subject.FRENCH]: [
    {
      id: "f1",
      question: "Comment dit-on 'I have' en français ?",
      options: ["Je suis", "J'ai", "Je vais", "Je fais"],
      correctAnswer: "J'ai",
      explanation: "'Avoir' means 'to have'."
    }
  ]
};

export const geminiService = {
  async generateQuestions(
    subject: Subject,
    grade: Grade,
    count: number = 10
  ) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "questions",
          subject,
          grade,
          count
        })
      });

      if (!res.ok) throw new Error("Server error");

      return await res.json();
    } catch (err) {
      console.warn("Using fallback questions", err);
      return FALLBACK_QUESTIONS[subject]?.slice(0, count) || [];
    }
  },

  async generateStory(subject: Subject, grade: Grade) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "story",
          subject,
          grade
        })
      });

      if (!res.ok) throw new Error("Server error");

      return await res.json();
    } catch (err) {
      console.warn("Story fallback used", err);
      return null;
    }
  }
};
