// Direct Chat API Service for Oxalate Oracle
const ORACLE_API_URL = "https://flowise.iconnectit.co.uk/api/v1/prediction/df2d3204-ca40-445e-9eda-e626ab246a31";

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

// Simple question enhancement - minimal processing for speed
export const enhanceQuestionWithSystemContext = (question: string, systemContext?: string): string => {
  if (!systemContext) return question;
  return `${systemContext}\n\n${question}`;
};

// Direct API query function - exactly matching your working code
export const queryOxalateOracle = async (question: string, systemContext?: string): Promise<ChatResponse> => {
  try {
    console.log('Sending to Oracle:', { question }); // Debug log

    // Exact copy of your working fetch code - NO TIMEOUT, NO ABORT CONTROLLER
    const response = await fetch(ORACLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const result = await response.json();
    console.log('Oracle response:', result); // Debug log

    // Handle the response format from your Flowise endpoint
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

    // Return whatever we get as text
    return { text: JSON.stringify(result) };

  } catch (error) {
    console.error('Oxalate Oracle API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to connect to the Oxalate Oracle'
    };
  }
};

// Optimized streaming - no fake delays, just fast response
export const queryOxalateOracleStreaming = async (
  question: string,
  callbacks: StreamingCallbacks,
  systemContext?: string
): Promise<void> => {
  try {
    // Get response as fast as possible
    const response = await queryOxalateOracle(question, systemContext);

    if (response.text) {
      // Immediately show the full response - no artificial delays
      callbacks.onToken(response.text);
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

// Predefined quick questions for the Oracle - organized by category
export const quickOracleQuestions = [
  // Basics
  "What are oxalates and why should I limit them?",
  "What's a safe daily oxalate limit for me?",
  "How do oxalates form kidney stones?",

  // High-risk foods
  "Which foods are highest in oxalates?",
  "Can I eat spinach on a low-oxalate diet?",
  "Are nuts and seeds high in oxalates?",
  "What about chocolate and tea?",

  // Cooking & preparation
  "What cooking methods help reduce oxalates?",
  "Does boiling vegetables remove oxalates?",
  "Should I peel vegetables to reduce oxalates?",

  // Meal planning
  "What are good low-oxalate breakfast ideas?",
  "How do I meal prep for low-oxalate eating?",
  "What are safe snack options?",
  "Can I eat out on a low-oxalate diet?",

  // Supplements & absorption
  "Should I take calcium with high-oxalate foods?",
  "How can I reduce oxalate absorption?",
  "Do probiotics help with oxalates?",
  "What supplements should I avoid?",

  // Symptoms & health
  "What are symptoms of high oxalate intake?",
  "How long does it take to see results?",
  "Can I reverse kidney stone formation?",

  // Alternatives
  "What are good substitutes for high-oxalate foods?",
  "How do I get enough calcium without dairy?",
  "What grains are lowest in oxalates?",
];

// Popular starter questions for new users
export const popularOracleQuestions = [
  "What are oxalates and should I be concerned?",
  "Which foods should I avoid on a low-oxalate diet?",
  "What are the best low-oxalate breakfast options?",
  "How do I reduce oxalate absorption naturally?",
  "What cooking methods help lower oxalates?",
  "Can I still eat chocolate and nuts?",
  "What are good calcium sources for low-oxalate diets?",
  "How much oxalate is safe per day?",
];

// Balanced fallback responses when API is down - neutral advice for all diet types
export const getOracleWisdom = (question: string): string => {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('oxalate') && (lowerQuestion.includes('what') || lowerQuestion.includes('explain'))) {
    return "The Oracle says: Oxalates are naturally occurring compounds found in many plant foods. Different people have different tolerance levels - some need to limit them for kidney stone prevention, while others can enjoy oxalate-rich foods as part of a balanced diet.";
  }

  if (lowerQuestion.includes('limit') || lowerQuestion.includes('daily') || lowerQuestion.includes('much')) {
    return "The Oracle recommends: Oxalate needs vary greatly by individual. Those with kidney stones may need 40-50mg daily, while others can consume 100-200mg+ safely. Your healthcare provider can help determine what's right for you.";
  }

  if (lowerQuestion.includes('spinach') || lowerQuestion.includes('high oxalate')) {
    return "The Oracle notes: Spinach contains about 750mg oxalates per cup, making it very high. If you're on a restricted diet, consider alternatives like lettuce or bok choy. If you can tolerate oxalates, spinach offers excellent nutrition when paired with calcium.";
  }

  if (lowerQuestion.includes('calcium') || lowerQuestion.includes('supplement')) {
    return "The Oracle advises: Calcium can help bind oxalates in your digestive system. Taking calcium with oxalate-rich meals may reduce absorption. Calcium citrate is often preferred, but consult your healthcare provider for personalized advice.";
  }

  if (lowerQuestion.includes('cook') || lowerQuestion.includes('boil') || lowerQuestion.includes('prepare')) {
    return "The Oracle teaches: Boiling vegetables can reduce oxalates by 30-90% - discard the cooking water. This is helpful for those limiting oxalates. If you're not restricted, steaming preserves more nutrients while still reducing some oxalates.";
  }

  if (lowerQuestion.includes('breakfast')) {
    return "The Oracle suggests: Breakfast options depend on your oxalate tolerance. Lower options include eggs, white rice, bananas, and coconut yogurt. Higher tolerance allows oats, berries, nuts, and whole grains. Choose based on your dietary approach.";
  }

  return "The Oracle hears your question. I provide balanced oxalate wisdom for all dietary approaches - whether you're limiting, moderating, or freely enjoying oxalate-rich foods!";
};