export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  isTyping?: boolean;
}

export interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingMessageId: string | null;
  
  // Actions
  addMessage: (text: string, isUser: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  sendMessageStreaming: (text: string) => Promise<void>;
  updateStreamingMessage: (messageId: string, text: string) => void;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}