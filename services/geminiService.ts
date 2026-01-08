
import { GoogleGenAI, Type } from "@google/genai";
import { Grade, Subject } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let lastCall = 0;
const COOLDOWN_MS = 3000;

function checkRateLimit() {
  const now = Date.now();
  if (now - lastCall < COOLDOWN_MS) {
    throw new Error("Please wait before generating again");
  }
  lastCall = now;
}

const FALLBACK_QUESTIONS: Record<string, any[]> = {
  [Subject.ENGLISH]: [
    { id: 'e1', question: "Identify the figure of speech: 'The wind whispered through the trees'.", options: ["Simile", "Metaphor", "Personification", "Alliteration"], correctAnswer: "Personification", explanation: "Attributing human qualities (whispering) to non-human things (wind) is personification." },
    { id: 'e2', question: "Which tense is used in: 'I have been studying for three hours'?", options: ["Past Continuous", "Present Perfect Continuous", "Future Perfect", "Present Perfect"], correctAnswer: "Present Perfect Continuous", explanation: "The structure 'have been + verb-ing' denotes an action that started in the past and continues to the present." }
  ],
  [Subject.HINDI]: [
    { id: 'h1', question: "सूरदास की प्रसिद्ध रचना कौन सी है?", options: ["साकेत", "सूरसागर", "कामायनी", "यशोधरा"], correctAnswer: "सूरसागर", explanation: "सूरसागर सूरदास की सबसे प्रसिद्ध और महत्वपूर्ण रचना है।" },
    { id: 'h2', question: "'कमल' का पर्यायवाची शब्द क्या है?", options: ["नीरद", "पंकज", "अंबर", "दिनकर"], correctAnswer: "पंकज", explanation: "पंकज कमल का पर्यायवाची है, जिसका अर्थ है कीचड़ में जन्म लेने वाला।" }
  ],
  [Subject.FRENCH]: [
    { id: 'f1', question: "Comment dit-on 'I have' en français ?", options: ["Je suis", "J'ai", "Je vais", "Je fais"], correctAnswer: "J'ai", explanation: "Le verbe 'avoir' (to have) à la première personne du présent est 'J'ai'." },
    { id: 'f2', question: "Quel est le pluriel de 'le journal' ?", options: ["les journals", "les journaux", "les journale", "les journalles"], correctAnswer: "les journaux", explanation: "En français, les mots finissant par -al prennent généralement -aux au pluriel." }
  ]
};

const SYLLABUS = {
  [Subject.ENGLISH]: {
    [Grade.GRADE_6]: {
      literature: ["Neem Baba", "The Unlikely Best Friends", "The Merchant of Venice (Play)", "The Chair (Play)", "The Painted Ceiling (Poem)"],
      grammar: ["Active Passive Voice", "Conjunctions", "Prepositions", "Tenses", "Subject Verb Agreement", "Idioms", "One word Substitution"]
    },
    [Grade.GRADE_7]: { literature: ["The School Boy", "Mrs. Packletide’s Tiger"], grammar: ["Verbs", "Determiners"] },
    [Grade.GRADE_8]: { literature: ["As You Like It", "The Best Christmas Present"], grammar: ["Reported Speech", "Sentence Reordering"] }
  },
  [Subject.FRENCH]: {
    [Grade.GRADE_6]: {
      grammar: ["Verb avoir", "Verb aller", "Prepositions", "Negation"],
      lessons: ["Leçon-6 Tu es de quel pays", "Leçon-7 Le Week-end", "Lecon-8 Ma famille", "Leçon-9 Bon Anniversaire", "Lecon-10 Ma saison preferee"]
    },
    [Grade.GRADE_7]: { grammar: ["Adjectives", "Imperative"], lessons: ["Leçon 6: Les fêtes", "Leçon 7: La francophonie"] },
    [Grade.GRADE_8]: { grammar: ["Interrogation"], lessons: ["Leçon 8: La nouvelle génération", "Leçon 9: On prépare la fête"] }
  },
  [Subject.HINDI]: {
    [Grade.GRADE_6]: {
      literature: ["मैया मैं नहिं माखन खायो (सूरदास)", "हिन्द महासागर में छोटा-सा हिन्दुस्तान", "परख", "स्त्रियाँ और बिहू नृत्य", "चेतक की वीरता"],
      grammar: ["वर्ण विचार", "अव्यय-क्रिया विशेषण", "काल", "विराम चिह्न", "स्वर संधि (दीर्घ)", "वाक्य", "अशुद्धि शोधन", "समरूपी भिन्नार्थक शब्द"]
    },
    [Grade.GRADE_7]: { literature: ["कबीर की साखियाँ"], grammar: ["समास", "पर्यायवाची"] },
    [Grade.GRADE_8]: { literature: ["अकबरी लोटा", "सुदामा चरित"], grammar: ["उपसर्ग", "प्रत्यय"] }
  }
};

export const geminiService = {
  async generateQuestions(subject: Subject, grade: Grade, count: number = 10) {
    checkRateLimit();

    const ai = new GoogleGenAI({ apiKey });
    const subjectSyllabus =
      SYLLABUS[subject]?.[grade] || SYLLABUS[subject]?.[Grade.GRADE_6];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${count} language revision multiple choice questions for ${subject} Grade ${grade}.
        Each question MUST include explanation. Output JSON.`,
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

      const data = JSON.parse(response.text || "[]");
      return data.length ? data : FALLBACK_QUESTIONS[subject];
    } catch (e) {
      console.warn("Gemini Error → fallback used", e);
      return FALLBACK_QUESTIONS[subject].slice(0, count);
    }
  },

  async generateStory(subject: Subject, grade: Grade) {
    checkRateLimit();

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Create a revision story for ${subject} Grade ${grade}. Output JSON.`,
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || "null");
    } catch (e) {
      console.warn("Story Error", e);
      return null;
    }
  }
};
