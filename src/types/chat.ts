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
  
  // Actions
  addMessage: (text: string, isUser: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}