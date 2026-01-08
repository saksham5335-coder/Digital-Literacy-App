import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Grade, Subject } from "../types";

const FALLBACK_QUESTIONS: Record<string, any[]> = {
  [Subject.ENGLISH]: [
    { id: 'e1', question: "Identify the figure of speech: 'The wind whispered through the trees'.", options: ["Simile", "Metaphor", "Personification", "Alliteration"], correctAnswer: "Personification", explanation: "Attributing human qualities to non-human things is personification." },
    { id: 'e2', question: "Which tense is used in: 'I have been studying for three hours'?", options: ["Past Continuous", "Present Perfect Continuous", "Future Perfect", "Present Perfect"], correctAnswer: "Present Perfect Continuous", explanation: "The structure 'have been + verb-ing' denotes ongoing past action." }
  ],
  [Subject.HINDI]: [
    { id: 'h1', question: "सूरदास की प्रसिद्ध रचना कौन सी है?", options: ["साकेत", "सूरसागर", "कामायनी", "यशोधरा"], correctAnswer: "सूरसागर", explanation: "सूरसागर सूरदास की सबसे प्रसिद्ध रचना है।" },
    { id: 'h2', question: "'कमल' का पर्यायवाची शब्द क्या है?", options: ["नीरद", "पंकज", "अंबर", "दिनकर"], correctAnswer: "पंकज", explanation: "पंकज का अर्थ है कीचड़ में जन्म लेने वाला (कमल)।" }
  ],
  [Subject.FRENCH]: [
    { id: 'f1', question: "Comment dit-on 'I have' en français ?", options: ["Je suis", "J'ai", "Je vais", "Je fais"], correctAnswer: "J'ai", explanation: "Le verbe 'avoir' (to have) à la première personne est 'J'ai'." },
    { id: 'f2', question: "Quel est le pluriel de 'le journal' ?", options: ["les journals", "les journaux", "les journale", "les journalles"], correctAnswer: "les journaux", explanation: "Les mots finissant par -al prennent -aux au pluriel." }
  ]
};

const SYLLABUS = {
  [Subject.ENGLISH]: {
    [Grade.GRADE_6]: { literature: ["Neem Baba", "Merchant of Venice"], grammar: ["Voice", "Tenses"] },
    [Grade.GRADE_7]: { literature: ["The School Boy"], grammar: ["Determiners"] },
    [Grade.GRADE_8]: { literature: ["As You Like It"], grammar: ["Reported Speech"] }
  },
  [Subject.FRENCH]: {
    [Grade.GRADE_6]: { grammar: ["Avoir", "Aller"], lessons: ["Tu es de quel pays", "Ma famille"] },
    [Grade.GRADE_7]: { grammar: ["Adjectives"], lessons: ["Les fêtes"] },
    [Grade.GRADE_8]: { grammar: ["Interrogation"], lessons: ["La nouvelle génération"] }
  },
  [Subject.HINDI]: {
    [Grade.GRADE_6]: { literature: ["सूरदास के पद", "चेतक की वीरता"], grammar: ["वर्ण विचार", "काल"] },
    [Grade.GRADE_7]: { literature: ["कबीर की साखियाँ"], grammar: ["समास"] },
    [Grade.GRADE_8]: { literature: ["अकबरी लोटा"], grammar: ["उपसर्ग-प्रत्यय"] }
  }
};

export const geminiService = {
  async generateQuestions(subject: Subject, grade: Grade, count: number = 10) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "fallback" });
    const syllabusContext = JSON.stringify(SYLLABUS[subject]?.[grade] || {});

    try {
      if (!process.env.API_KEY) throw new Error("No Key");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${count} revision MCQs for ${subject} Grade ${grade} based on: ${syllabusContext}. JSON output.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return (FALLBACK_QUESTIONS[subject] || []).slice(0, count);
    }
  },

  async generateStory(subject: Subject, grade: Grade) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "fallback" });
    try {
      if (!process.env.API_KEY) throw new Error("No Key");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a 5-node revision adventure for ${subject} Grade ${grade}. JSON format.`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "null");
    } catch (e) { return null; }
  },

  async speakText(text: string, subject: Subject) {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voices = { [Subject.ENGLISH]: 'Puck', [Subject.HINDI]: 'Kore', [Subject.FRENCH]: 'Charon' };
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this ${subject} text: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voices[subject] || 'Kore' } } }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) { return null; }
  }
};
