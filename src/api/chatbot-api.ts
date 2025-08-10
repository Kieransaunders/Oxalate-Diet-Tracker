// Oxalate Chatbot API Service
const CHATBOT_URL = "https://flowise.iconnectit.co.uk/api/v1/prediction/df2d3204-ca40-445e-9eda-e626ab246a31";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatResponse {
  text?: string;
  error?: string;
}

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export const queryOxalateChatbotStreaming = async (
  question: string, 
  callbacks: StreamingCallbacks
): Promise<void> => {
  // Check cache first
  const cached = getCachedResponse(question);
  if (cached) {
    // Simulate streaming for cached responses
    const words = cached.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      callbacks.onToken(words[i] + (i < words.length - 1 ? ' ' : ''));
      
      // Add small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    callbacks.onComplete(cached);
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (reduced)

    const response = await fetch(CHATBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if the response supports streaming
    const reader = response.body?.getReader();
    
    if (reader) {
      // Try to read as a stream
      let fullText = '';
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Try to parse potential JSON chunks
          try {
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  fullText += data.token;
                  callbacks.onToken(data.token);
                }
              }
            }
          } catch {
            // If not streaming JSON, treat as text chunk
            fullText += chunk;
            callbacks.onToken(chunk);
          }
        }
        
        if (fullText) {
          // Cache successful responses
          setCachedResponse(question, fullText);
          callbacks.onComplete(fullText);
        } else {
          throw new Error('No content received');
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      // Fallback to regular JSON response
      const result = await response.json();
      const text = extractTextFromResponse(result);
      
      if (text) {
        // Simulate streaming by sending text word by word
        const words = text.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
          currentText += (i === 0 ? '' : ' ') + words[i];
          callbacks.onToken(words[i] + (i < words.length - 1 ? ' ' : ''));
          
          // Add small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 40));
        }
        
        // Cache successful responses
        setCachedResponse(question, text);
        callbacks.onComplete(text);
      } else {
        throw new Error('No valid response received');
      }
    }
    
  } catch (error) {
    console.error('Chatbot Streaming Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      callbacks.onError('Request timed out. Please try again.');
    } else {
      callbacks.onError(error instanceof Error ? error.message : 'Failed to get response from chatbot');
    }
  }
};

// Non-streaming version for backward compatibility
export const queryOxalateChatbot = async (question: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(CHATBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const text = extractTextFromResponse(result);
    
    return text ? { text } : { error: 'No valid response received' };
    
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to get response from chatbot'
    };
  }
};

// Helper function to extract text from various response formats
const extractTextFromResponse = (result: any): string | null => {
  if (typeof result === 'string') {
    return result;
  }
  
  if (result.text) {
    return result.text;
  }
  
  if (result.answer) {
    return result.answer;
  }
  
  if (result.response) {
    return result.response;
  }

  if (result.message) {
    return result.message;
  }

  // Fallback - stringify the result if it's an object
  try {
    return JSON.stringify(result);
  } catch {
    return null;
  }
};

// Helper function to add context about current meal/foods to questions
export const addFoodContext = (question: string, currentMeal?: any[], recentFoods?: string[]): string => {
  let context = "";
  
  if (currentMeal && currentMeal.length > 0) {
    const mealItems = currentMeal.map(item => `${item.food.name} (${item.oxalateAmount.toFixed(1)}mg oxalate)`).join(', ');
    context += `My current meal includes: ${mealItems}. `;
  }
  
  if (recentFoods && recentFoods.length > 0) {
    context += `I've been looking at these foods: ${recentFoods.join(', ')}. `;
  }
  
  return context + question;
};

// Predefined quick questions about oxalates
export const quickQuestions = [
  "What are oxalates and why should I limit them?",
  "What's a safe daily oxalate limit?",
  "Which foods are highest in oxalates?",
  "How can I reduce oxalate absorption?",
  "What are symptoms of high oxalate intake?",
  "Can I eat spinach on a low-oxalate diet?",
  "What cooking methods reduce oxalates?",
  "Should I take calcium with high-oxalate foods?",
];

// Response cache for common questions
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedResponse = (question: string): string | null => {
  const normalizedQuestion = question.toLowerCase().trim();
  const cached = responseCache.get(normalizedQuestion);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  
  return null;
};

export const setCachedResponse = (question: string, response: string): void => {
  const normalizedQuestion = question.toLowerCase().trim();
  responseCache.set(normalizedQuestion, {
    response,
    timestamp: Date.now(),
  });
  
  // Clean up old cache entries (keep only last 50)
  if (responseCache.size > 50) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    responseCache.clear();
    entries.slice(0, 50).forEach(([key, value]) => {
      responseCache.set(key, value);
    });
  }
};

// Mock responses for offline mode or API failures
export const getMockResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  // Check cache first
  const cached = getCachedResponse(question);
  if (cached) {
    return cached;
  }
  
  let response = "";
  
  if (lowerQuestion.includes('oxalate') && lowerQuestion.includes('what')) {
    response = "Oxalates are natural compounds found in many plants. In some people, high oxalate intake can contribute to kidney stone formation. A low-oxalate diet typically limits intake to 40-50mg per day.";
  } else if (lowerQuestion.includes('limit') || lowerQuestion.includes('daily')) {
    response = "Most low-oxalate diets recommend limiting intake to 40-50mg per day. Some stricter protocols suggest 20mg or less. It's best to work with a healthcare provider to determine your ideal limit.";
  } else if (lowerQuestion.includes('spinach')) {
    response = "Spinach is very high in oxalates (about 750mg per cup raw). It's generally avoided on low-oxalate diets. Consider alternatives like lettuce, cabbage, or bok choy instead.";
  } else if (lowerQuestion.includes('calcium')) {
    response = "Taking calcium with high-oxalate foods can help reduce oxalate absorption. The calcium binds to oxalates in your digestive system, reducing the amount your body absorbs.";
  } else if (lowerQuestion.includes('cook') || lowerQuestion.includes('boil')) {
    response = "Boiling high-oxalate vegetables can reduce their oxalate content by 30-90%. Discard the cooking water. Steaming and roasting are less effective but still help somewhat.";
  } else if (lowerQuestion.includes('kidney stone')) {
    response = "High oxalate intake can contribute to calcium oxalate kidney stones in susceptible individuals. A low-oxalate diet, adequate hydration, and appropriate calcium intake can help reduce risk.";
  } else {
    response = "I'm here to help with oxalate-related questions! You can ask me about specific foods, daily limits, cooking methods, or general oxalate information.";
  }
  
  // Cache the response
  setCachedResponse(question, response);
  
  return response;
};