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

    // If result has a message property
    if (result.message) {
      return { text: result.message };
    }

    // Fallback - stringify the result if it's an object
    return { text: JSON.stringify(result) };
    
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to get response from chatbot'
    };
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

// Mock responses for offline mode or API failures
export const getMockResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('oxalate') && lowerQuestion.includes('what')) {
    return "Oxalates are natural compounds found in many plants. In some people, high oxalate intake can contribute to kidney stone formation. A low-oxalate diet typically limits intake to 40-50mg per day.";
  }
  
  if (lowerQuestion.includes('limit') || lowerQuestion.includes('daily')) {
    return "Most low-oxalate diets recommend limiting intake to 40-50mg per day. Some stricter protocols suggest 20mg or less. It's best to work with a healthcare provider to determine your ideal limit.";
  }
  
  if (lowerQuestion.includes('spinach')) {
    return "Spinach is very high in oxalates (about 750mg per cup raw). It's generally avoided on low-oxalate diets. Consider alternatives like lettuce, cabbage, or bok choy instead.";
  }
  
  if (lowerQuestion.includes('calcium')) {
    return "Taking calcium with high-oxalate foods can help reduce oxalate absorption. The calcium binds to oxalates in your digestive system, reducing the amount your body absorbs.";
  }
  
  return "I'm here to help with oxalate-related questions! You can ask me about specific foods, daily limits, cooking methods, or general oxalate information.";
};