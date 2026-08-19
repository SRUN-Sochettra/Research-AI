import { HumanMessage } from "@langchain/core/messages";
import { aiRouter } from "@/lib/ai/router";
import { QUERY_REFORMULATION_PROMPT } from "@/lib/ai/prompts";
import { logger } from "@/lib/observability/logger";
import type { Message } from "@/types/database";

export async function reformulateQuery(
  question: string,
  conversationHistory: Message[],
  userId: string,
  conversationId: string
): Promise<string> {
  void userId;
  void conversationId;
  // If no history, no need to reformulate
  if (conversationHistory.length === 0) {
    return question;
  }

  // If very short history, also skip
  if (conversationHistory.length < 2) {
    return question;
  }

  try {
    // Format recent history for context
    const recentHistory = conversationHistory
      .slice(-6) // Last 3 exchanges
      .map(
        (msg) =>
          `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    const promptText = await QUERY_REFORMULATION_PROMPT.format({
      chat_history: recentHistory,
      question,
    });
    const { text: reformulated } = await aiRouter.invokeText({
      workload: "query-reformulation",
      messages: [new HumanMessage(promptText)],
      temperature: 0,
    });

    logger.debug("[QueryReformulator] Reformulated query", {
      original: question,
      reformulated: reformulated.trim(),
    });

    return reformulated.trim() || question;
  } catch (error) {
    // If reformulation fails, use original question
    logger.warn("[QueryReformulator] Failed, using original query", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return question;
  }
}

// Format conversation history for the QA prompt
export function formatConversationHistory(
  messages: Message[],
  maxMessages = 10
): string {
  if (messages.length === 0) return "No previous conversation.";

  return messages
    .slice(-maxMessages)
    .map((msg) => {
      const role = msg.role === "user" ? "Human" : "Assistant";
      // Truncate very long messages in history
      const content =
        msg.content.length > 500
          ? msg.content.slice(0, 500) + "..."
          : msg.content;
      return `${role}: ${content}`;
    })
    .join("\n");
}
