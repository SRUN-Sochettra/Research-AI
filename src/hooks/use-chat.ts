import { useState } from 'react';

export function useChat(documentId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    // call API
    setIsLoading(false);
  };

  return { messages, isLoading, sendMessage };
}
