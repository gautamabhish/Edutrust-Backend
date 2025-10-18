import { GoogleGenAI, Type } from "@google/genai";
import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";

export interface StructuredResponse {
  aiQuestion: string;
  satisfactionRate: number;
  AIemotion?: 'Sad' | 'Smile' | 'LEyebrowUp' | 'REyebrowUp';
  endNext?: boolean;
  summary?: string;
}


type UserSessionKey = `${string}:${string}`;

export class GeminiUtility {
  private static client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
  });

  private static userSessions: Map<UserSessionKey, BufferMemory> = new Map();

  /** Create or get user session memory */
  private static getUserSessionMemory(userId: string, sessionId: string): BufferMemory {
    const key: UserSessionKey = `${userId}:${sessionId}`;
    if (!this.userSessions.has(key)) {
      const memory = new BufferMemory({
        memoryKey: "chat_history",
        inputKey: "input",
        outputKey: "response",
        returnMessages: true,
      });
      this.userSessions.set(key, memory);
    }
    return this.userSessions.get(key)!;
  }

  /** Convert history to text prompt */
  private static historyToPrompt(messages: BaseMessage[]): string {
    return messages
      .map((m) => {
        const role = m._getType() === "human" ? "Candidate" : "AI Interviewer";
        const content = m.content?.toString().trim();
        return content ? `${role}: ${content}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  /** Build contextually rich prompt for Gemini */
  private static buildPrompt(
    chatHistory: BaseMessage[],
    candidateAnswer: string,
    role?: string,
    personName?: string,
    expectations?: string,
    resume?: string,
    emotion: string = "Neutral"
  ): string {
    const historyText = this.historyToPrompt(chatHistory);
    let prompt = "";

    // System prompt for the first question
    if (chatHistory.length === 0 && role && personName && expectations) {
      prompt = `
You are a **real human interviewer** speaking naturally with ${personName}, who is interviewing for the **${role}** role.
Expectations from this role: ${expectations}.
Candidate emotion: ${emotion}.
Resume: ${resume?.substring(0, 300)}.

You are confident, human-like, emotionally aware, and conversational.
Avoid robotic phrasing.
The candidate has already introduced themselves — do NOT ask for introductions again.

Your task:
- Continue the interview naturally with relevant questions or follow-ups.
- Keep tone professional but warm.
- If you feel the interview is complete, set "endNext" to true and include a short **spoken-style summary** about the candidate’s overall performance, strengths, and impression.
- The "summary" should sound like you are personally speaking to the candidate at the end (not bullet points).

Respond **only** in JSON format:
{
  "aiQuestion": "<your next spoken interviewer line>",
  "satisfactionRate": <1–100>,
  "emotion": "<Sad | Smile | LEyebrowUp | REyebrowUp>",
  "endNext": <true|false>,
  "summary": "<optional — only if endNext is true>"
}

Conversation so far:
${historyText ? historyText + "\n" : ""}
Candidate: ${candidateAnswer.trim()}
AI Interviewer:
`;
    } else {
      // Continue existing flow
      prompt = `${historyText ? historyText + "\n" : ""}Candidate: ${candidateAnswer.trim()}\nAI Interviewer:`;
    }

    return prompt.trim();
  }
/** Main Interview Handler with token usage */
static async askGemini(
  userId: string,
  sessionId: string,
  candidateAnswer: string,
  role?: string,
  personName?: string,
  expectations?: string,
  resume?: string,
  emotion?: string
): Promise<StructuredResponse & { tokenUsage: number }> {
  const memory = this.getUserSessionMemory(userId, sessionId);
  const chatHistory = (await memory.loadMemoryVariables({})).chat_history ?? [];

  const prompt = this.buildPrompt(
    chatHistory as BaseMessage[],
    candidateAnswer,
    role,
    personName,
    expectations,
    resume,
    emotion
  );

  const schema = {
    type: Type.OBJECT,
    properties: {
      aiQuestion: { type: Type.STRING, description: "Next interviewer question or statement" },
      satisfactionRate: { type: Type.NUMBER, description: "Candidate satisfaction (1–100)" },
   AIemotion: {
  type: Type.STRING,
  description: "Facial emotion for avatar animation",
  enum: ["Sad", "Smile", "LEyebrowUp", "REyebrowUp"],
},

      endNext: { type: Type.BOOLEAN, description: "Flag if interview should end" },
      summary: {
        type: Type.STRING,
        description:
          "Short, spoken-style final feedback about the candidate (only if endNext is true)",
      },
    },
    required: ["aiQuestion", "satisfactionRate"],
  };

  const response = await this.client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  let parsed: StructuredResponse;
  try {
    parsed = JSON.parse(response.text!) as StructuredResponse;
  } catch (err) {
    console.error("Failed to parse structured output:", err, "\nRaw:", response.text);
    parsed = {
      aiQuestion: "Could you please elaborate on that?",
      satisfactionRate: 70,
      AIemotion: "Smile",
      endNext: false,
    };
  }

  // Save in memory for continuity
  if (candidateAnswer?.trim() && parsed.aiQuestion?.trim()) {
    await memory.saveContext(
      { input: candidateAnswer.trim() },
      { response: parsed.aiQuestion.trim() }
    );
  }

  return {
    ...parsed,
    tokenUsage: response.usageMetadata?.totalTokenCount ?? 0,
  };
}


}
