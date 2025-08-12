import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../api/chat-oracle-api';
import { queryOxalateOracleStreaming, queryOxalateOracle, getOracleWisdom } from '../api/chat-oracle-api';

interface OracleStore {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingMessageId: string | null;
  
  // Actions
  addMessage: (text: string, isUser: boolean) => void;
  sendMessage: (text: string, systemContext?: string) => Promise<void>;
  sendMessageStreaming: (text: string, systemContext?: string) => Promise<void>;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
}

export const useOracleStore = create<OracleStore>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: 'welcome',
          text: "🔮 Welcome, seeker of oxalate wisdom! I am the Oxalate Oracle, your guide through the mysteries of low-oxalate living. Ask me anything about foods, daily limits, cooking methods, or managing your oxalate journey.",
          isUser: false,
          timestamp: Date.now(),
        }
      ],
      isLoading: false,
      streamingMessageId: null,

      addMessage: (text: string, isUser: boolean) => {
        const newMessage: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          isUser,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, newMessage]
        }));
      },

      sendMessage: async (text: string) => {
        const { addMessage } = get();
        
        // Add user message
        addMessage(text, true);
        
        // Set loading state
        set({ isLoading: true });

        try {
          // Query the Oracle API
          const response = await queryOxalateOracle(text);
          
          // Add Oracle response
          if (response.text) {
            addMessage(response.text, false);
          } else if (response.error) {
            // Fallback to Oracle wisdom if API fails
            const wisdom = getOracleWisdom(text);
            addMessage(wisdom, false);
          }
        } catch (error) {
          // Fallback to Oracle wisdom
          const wisdom = getOracleWisdom(text);
          addMessage(wisdom, false);
        } finally {
          set({ isLoading: false });
        }
      },

      sendMessageStreaming: async (text: string) => {
        const { addMessage, isLoading, streamingMessageId } = get();
        
        // Prevent duplicate requests
        if (isLoading || streamingMessageId) {
          return;
        }
        
        // Add user message
        addMessage(text, true);
        
        // Create empty Oracle message for streaming
        const oracleMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const oracleMessage: ChatMessage = {
          id: oracleMessageId,
          text: '',
          isUser: false,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, oracleMessage],
          isLoading: true,
          streamingMessageId: oracleMessageId,
        }));

        try {
          let fullText = '';
          
          await queryOxalateOracleStreaming(text, {
            onToken: (token: string) => {
              fullText += token;
              set((state) => ({
                messages: state.messages.map(msg => 
                  msg.id === oracleMessageId 
                    ? { ...msg, text: fullText }
                    : msg
                )
              }));
            },
            onComplete: (completedText: string) => {
              set((state) => ({
                messages: state.messages.map(msg => 
                  msg.id === oracleMessageId 
                    ? { ...msg, text: completedText }
                    : msg
                ),
                isLoading: false,
                streamingMessageId: null,
              }));
            },
            onError: (error: string) => {
              // Remove the empty Oracle message and add wisdom
              const wisdom = getOracleWisdom(text);
              set((state) => ({
                messages: [
                  ...state.messages.filter(msg => msg.id !== oracleMessageId),
                  {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    text: wisdom,
                    isUser: false,
                    timestamp: Date.now(),
                  }
                ],
                isLoading: false,
                streamingMessageId: null,
              }));
            }
          });
        } catch (error) {
          // Fallback to Oracle wisdom
          const wisdom = getOracleWisdom(text);
          set((state) => ({
            messages: [
              ...state.messages.filter(msg => msg.id !== oracleMessageId),
              {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: wisdom,
                isUser: false,
                timestamp: Date.now(),
              }
            ],
            isLoading: false,
            streamingMessageId: null,
          }));
        }
      },

      clearChat: () => {
        set({
          messages: [
            {
              id: 'welcome',
              text: "🔮 Welcome back, seeker! The Oxalate Oracle is ready to share wisdom about your low-oxalate journey. What knowledge do you seek?",
              isUser: false,
              timestamp: Date.now(),
            }
          ],
          streamingMessageId: null,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'oracle-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);