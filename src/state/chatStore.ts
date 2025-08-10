import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatStore, ChatMessage } from '../types/chat';
import { queryOxalateChatbotStreaming, queryOxalateChatbot, getMockResponse } from '../api/chatbot-api';

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: 'welcome',
          text: "Hi! I'm your oxalate diet assistant. I can help you understand oxalates, suggest food alternatives, and answer questions about low-oxalate eating. What would you like to know?",
          isUser: false,
          timestamp: Date.now(),
        }
      ],
      isLoading: false,
      streamingMessageId: null,

      addMessage: (text: string, isUser: boolean) => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
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
          // Query the chatbot API
          const response = await queryOxalateChatbot(text);
          
          // Add bot response
          if (response.text) {
            addMessage(response.text, false);
          } else if (response.error) {
            // Fallback to mock response if API fails
            const mockResponse = getMockResponse(text);
            addMessage(mockResponse, false);
          }
        } catch (error) {
          // Fallback to mock response
          const mockResponse = getMockResponse(text);
          addMessage(mockResponse, false);
        } finally {
          set({ isLoading: false });
        }
      },

      sendMessageStreaming: async (text: string) => {
        const { addMessage } = get();
        
        // Add user message
        addMessage(text, true);
        
        // Create empty bot message for streaming
        const botMessageId = Date.now().toString();
        const botMessage: ChatMessage = {
          id: botMessageId,
          text: '',
          isUser: false,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, botMessage],
          isLoading: true,
          streamingMessageId: botMessageId,
        }));

        try {
          let fullText = '';
          
          await queryOxalateChatbotStreaming(text, {
            onToken: (token: string) => {
              fullText += token;
              set((state) => ({
                messages: state.messages.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, text: fullText }
                    : msg
                )
              }));
            },
            onComplete: (completedText: string) => {
              set((state) => ({
                messages: state.messages.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, text: completedText }
                    : msg
                ),
                isLoading: false,
                streamingMessageId: null,
              }));
            },
            onError: (error: string) => {
              // Remove the empty bot message and add error message
              set((state) => ({
                messages: [
                  ...state.messages.filter(msg => msg.id !== botMessageId),
                  {
                    id: Date.now().toString(),
                    text: getMockResponse(text),
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
          // Fallback to mock response
          set((state) => ({
            messages: [
              ...state.messages.filter(msg => msg.id !== botMessageId),
              {
                id: Date.now().toString(),
                text: getMockResponse(text),
                isUser: false,
                timestamp: Date.now(),
              }
            ],
            isLoading: false,
            streamingMessageId: null,
          }));
        }
      },

      updateStreamingMessage: (messageId: string, text: string) => {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, text }
              : msg
          )
        }));
      },

      clearChat: () => {
        set({
          messages: [
            {
              id: 'welcome',
              text: "Hi! I'm your oxalate diet assistant. I can help you understand oxalates, suggest food alternatives, and answer questions about low-oxalate eating. What would you like to know?",
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
      name: 'chat-store',
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