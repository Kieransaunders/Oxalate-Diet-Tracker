// Direct Chat API Service for Oxalate Oracle
const ORACLE_API_URL = "https://flowise.iconnectit.co.uk/api/v1/prediction/38829e38-c961-4d31-b9d6-6506be363952";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  isStreaming?: boolean;
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

// Enhanced question with system context
export const enhanceQuestionWithSystemContext = (question: string, systemContext?: string): string => {
  if (!systemContext) return question;
  
  // Add system context as a prefix to help guide the Oracle's response
  return `[System Context: ${systemContext}]\n\nUser Question: ${question}`;
};

// Direct API query function
export const queryOxalateOracle = async (question: string, systemContext?: string): Promise<ChatResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(ORACLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: enhanceQuestionWithSystemContext(question, systemContext) }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 503 || response.status === 502) {
        throw new Error('The Oxalate Oracle is temporarily unavailable. Please try again in a moment.');
      } else if (response.status === 429) {
        throw new Error('Too many questions at once. Please wait a moment before asking again.');
      } else {
        throw new Error(`Oracle Error: ${response.status}`);
      }
    }

    const result = await response.json();
    
    // Handle different response formats
    if (typeof result === 'string') {
      return { text: result };
    }
    
    if (result.text) {
      return { text: result.text };
    }
    
    if (result.answer) {
      return { text: result.answer };
    }
    
    if (result.response) {
      return { text: result.response };
    }

    if (result.message) {
      return { text: result.message };
    }

    // Fallback
    return { text: JSON.stringify(result) };
    
  } catch (error) {
    console.error('Oxalate Oracle API Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'The Oracle is taking longer than usual. Let me try to help with my built-in wisdom instead.' };
    }
    
    return { 
      error: error instanceof Error ? error.message : 'Failed to connect to the Oxalate Oracle'
    };
  }
};

// Streaming version for real-time responses
export const queryOxalateOracleStreaming = async (
  question: string, 
  callbacks: StreamingCallbacks,
  systemContext?: string
): Promise<void> => {
  try {
    // For now, simulate streaming by breaking down the response
    const response = await queryOxalateOracle(question, systemContext);
    
    if (response.text) {
      const words = response.text.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        currentText += (i === 0 ? '' : ' ') + word;
        callbacks.onToken(word + (i < words.length - 1 ? ' ' : ''));
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      callbacks.onComplete(response.text);
    } else if (response.error) {
      callbacks.onError(response.error);
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'Oracle connection failed');
  }
};

// Context-aware question enhancement
export const enhanceQuestionWithContext = (
  question: string, 
  currentMeal?: any[], 
  recentFood?: string
): string => {
  let context = '';
  
  if (recentFood) {
    context += `I'm currently looking at ${recentFood}. `;
  }
  
  if (currentMeal && currentMeal.length > 0) {
    const mealItems = currentMeal.map(item => 
      `${item.food.name} (${item.oxalateAmount.toFixed(1)}mg oxalate)`
    ).join(', ');
    const totalOxalate = currentMeal.reduce((sum, item) => sum + item.oxalateAmount, 0);
    context += `Today I've eaten: ${mealItems}. Total oxalate today: ${totalOxalate.toFixed(1)}mg. `;
  }
  
  return context + question;
};

// Predefined quick questions for the Oracle
export const quickOracleQuestions = [
  "What are oxalates and why should I limit them?",
  "What's a safe daily oxalate limit for me?",
  "Which foods are highest in oxalates?",
  "How can I reduce oxalate absorption?",
  "What cooking methods help reduce oxalates?",
  "Can I eat spinach on a low-oxalate diet?",
  "What are good low-oxalate breakfast ideas?",
  "Should I take calcium with high-oxalate foods?",
  "What are symptoms of high oxalate intake?",
  "How do I meal prep for low-oxalate eating?",
];

// Fallback responses when API is down
export const getOracleWisdom = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('oxalate') && (lowerQuestion.includes('what') || lowerQuestion.includes('explain'))) {
    return "The Oracle says: Oxalates are naturally occurring compounds in plants that can form crystals in some people's bodies. A low-oxalate diet typically limits intake to 40-50mg per day to prevent kidney stones and other issues.";
  }
  
  if (lowerQuestion.includes('limit') || lowerQuestion.includes('daily') || lowerQuestion.includes('much')) {
    return "The Oracle recommends: Most people on low-oxalate diets should stay under 40-50mg per day. Some may need to go as low as 20mg. Work with a healthcare provider to find your ideal limit.";
  }
  
  if (lowerQuestion.includes('spinach') || lowerQuestion.includes('high oxalate')) {
    return "The Oracle warns: Spinach is extremely high in oxalates (750mg per cup). It's best avoided on low-oxalate diets. Try lettuce, cabbage, or bok choy instead.";
  }
  
  if (lowerQuestion.includes('calcium') || lowerQuestion.includes('supplement')) {
    return "The Oracle advises: Taking calcium with meals can help bind oxalates in your digestive system, reducing absorption. Calcium citrate is often preferred over calcium carbonate.";
  }
  
  if (lowerQuestion.includes('cook') || lowerQuestion.includes('boil') || lowerQuestion.includes('prepare')) {
    return "The Oracle teaches: Boiling vegetables can reduce oxalates by 30-90%. Always discard the cooking water. Steaming and roasting are less effective but still help.";
  }
  
  if (lowerQuestion.includes('breakfast')) {
    return "The Oracle suggests: Great low-oxalate breakfast options include eggs, white rice porridge, coconut yogurt, bananas, and herbal teas. Avoid nuts, berries, and whole grains.";
  }
  
  return "The Oracle hears your question. I specialize in oxalate wisdom - ask me about foods, daily limits, cooking methods, or managing a low-oxalate lifestyle!";
};