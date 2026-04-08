import Groq from "groq-sdk";

let groqInstance: Groq | null = null;

function getGroqClient() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey && process.env.NODE_ENV === "production") {
      console.warn("GROQ_API_KEY is missing. AI features will be disabled.");
    }
    groqInstance = new Groq({
      apiKey: apiKey || "dummy_key_for_build",
    });
  }
  return groqInstance;
}

export async function getGroqChatCompletion(messages: any[], persona?: string) {
  const groq = getGroqClient();
  const systemPrompt = `You are McdAI, a high-tech administrative assistant for SukaMCD dashboard. Your tone is professional, futuristic, and helpful. You excel at debugging, automation, and general administrative tasks. Use Markdown for formatting. ${persona ? `\n\nAdditional Instruction: ${persona}` : ""}`;

  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false,
  });
}
