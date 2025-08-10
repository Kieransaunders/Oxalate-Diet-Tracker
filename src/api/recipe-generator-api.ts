// Recipe Generator API Service
const RECIPE_API_URL = "https://flowise.iconnectit.co.uk/api/v1/prediction/38829e38-c961-4d31-b9d6-6506be363952";

export interface RecipeGenerationRequest {
  question: string;
  dietaryRestrictions?: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  servings?: number;
  cookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients?: string[];
  excludeIngredients?: string[];
}

export interface RecipeGenerationResponse {
  text?: string;
  error?: string;
}

export const generateRecipe = async (request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> => {
  try {
    // Construct a detailed prompt for recipe generation
    let prompt = request.question;
    
    // Add context and constraints
    const constraints = [];
    
    if (request.dietaryRestrictions?.includes('low-oxalate')) {
      constraints.push('must be low-oxalate (under 10mg oxalate per serving)');
    }
    
    if (request.mealType) {
      constraints.push(`suitable for ${request.mealType}`);
    }
    
    if (request.servings) {
      constraints.push(`serves ${request.servings} people`);
    }
    
    if (request.cookingTime) {
      constraints.push(`can be prepared in ${request.cookingTime} minutes or less`);
    }
    
    if (request.difficulty) {
      constraints.push(`${request.difficulty} to make`);
    }
    
    if (request.ingredients && request.ingredients.length > 0) {
      constraints.push(`must include: ${request.ingredients.join(', ')}`);
    }
    
    if (request.excludeIngredients && request.excludeIngredients.length > 0) {
      constraints.push(`must NOT include: ${request.excludeIngredients.join(', ')}`);
    }
    
    // Enhance the prompt with constraints
    if (constraints.length > 0) {
      prompt += `. The recipe ${constraints.join(', ')}.`;
    }
    
    // Add specific formatting request
    prompt += ` Please provide a complete recipe with:
1. Recipe title
2. Serving size
3. Preparation time
4. Cooking time
5. Difficulty level
6. Complete ingredients list with measurements
7. Step-by-step instructions
8. Estimated oxalate content per serving
9. Any helpful cooking tips`;

    const response = await fetch(RECIPE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: prompt })
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

    if (result.message) {
      return { text: result.message };
    }

    // Fallback - stringify the result if it's an object
    return { text: JSON.stringify(result) };
    
  } catch (error) {
    console.error('Recipe Generation API Error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate recipe'
    };
  }
};

// Predefined recipe prompts for quick generation
export const quickRecipePrompts = [
  {
    title: "Low-Oxalate Breakfast",
    prompt: "Give me a healthy low-oxalate breakfast recipe",
    mealType: "breakfast" as const,
    dietaryRestrictions: ["low-oxalate"],
  },
  {
    title: "Quick Lunch",
    prompt: "Give me a quick and easy low-oxalate lunch recipe",
    mealType: "lunch" as const,
    cookingTime: 30,
    difficulty: "easy" as const,
    dietaryRestrictions: ["low-oxalate"],
  },
  {
    title: "Family Dinner",
    prompt: "Give me a delicious low-oxalate dinner recipe for the family",
    mealType: "dinner" as const,
    servings: 4,
    dietaryRestrictions: ["low-oxalate"],
  },
  {
    title: "Healthy Snack",
    prompt: "Give me a healthy low-oxalate snack recipe",
    mealType: "snack" as const,
    cookingTime: 15,
    difficulty: "easy" as const,
    dietaryRestrictions: ["low-oxalate"],
  },
  {
    title: "Low-Oxalate Dessert",
    prompt: "Give me a sweet low-oxalate dessert recipe",
    mealType: "dessert" as const,
    dietaryRestrictions: ["low-oxalate"],
  },
];

// Enhanced recipe parsing with better extraction
export const parseRecipeResponse = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  let title = '';
  let description = '';
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let servings = 1;
  let prepTime: number | undefined;
  let cookTime: number | undefined;
  let difficulty: 'Easy' | 'Medium' | 'Hard' | undefined;
  let oxalateInfo = '';
  
  let currentSection = '';
  let isInIngredients = false;
  let isInInstructions = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const lowerLine = line.toLowerCase();
    
    // Extract title (first line or line starting with title/recipe)
    if (!title && (i === 0 || lowerLine.includes('title:') || lowerLine.includes('recipe:'))) {
      title = line.replace(/^(title|recipe):\s*/i, '').replace(/^#+\s*/, '').trim();
      continue;
    }
    
    // Extract servings
    if (lowerLine.includes('serv')) {
      const servingMatch = line.match(/(\d+)/);
      if (servingMatch) servings = parseInt(servingMatch[1]);
      continue;
    }
    
    // Extract times
    if (lowerLine.includes('prep') && lowerLine.includes('time')) {
      const timeMatch = line.match(/(\d+)/);
      if (timeMatch) prepTime = parseInt(timeMatch[1]);
      continue;
    }
    
    if (lowerLine.includes('cook') && lowerLine.includes('time')) {
      const timeMatch = line.match(/(\d+)/);
      if (timeMatch) cookTime = parseInt(timeMatch[1]);
      continue;
    }
    
    // Extract difficulty
    if (lowerLine.includes('difficulty')) {
      if (lowerLine.includes('easy')) difficulty = 'Easy';
      else if (lowerLine.includes('medium')) difficulty = 'Medium';
      else if (lowerLine.includes('hard')) difficulty = 'Hard';
      continue;
    }
    
    // Extract oxalate information
    if (lowerLine.includes('oxalate')) {
      oxalateInfo = line;
      continue;
    }
    
    // Detect sections
    if (lowerLine.includes('ingredient')) {
      isInIngredients = true;
      isInInstructions = false;
      continue;
    } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
      isInIngredients = false;
      isInInstructions = true;
      continue;
    }
    
    // Parse content based on current section
    if (isInIngredients) {
      const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim();
      if (cleanLine) ingredients.push(cleanLine);
    } else if (isInInstructions) {
      const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim();
      if (cleanLine) instructions.push(cleanLine);
    } else if (!title && !isInIngredients && !isInInstructions) {
      // Treat as description if we haven't found title yet
      description += (description ? ' ' : '') + line;
    }
  }
  
  // Fallback title
  if (!title) {
    title = 'Generated Recipe';
  }
  
  // Extract oxalate amount from oxalate info
  let oxalatePerServing = 5; // Default to medium-low
  if (oxalateInfo) {
    const oxalateMatch = oxalateInfo.match(/(\d+(?:\.\d+)?)/);
    if (oxalateMatch) {
      oxalatePerServing = parseFloat(oxalateMatch[1]);
    }
  }
  
  return {
    title,
    description: description || 'AI-generated low-oxalate recipe',
    ingredients: ingredients.map((ing, index) => ({
      id: `${Date.now()}_${index}`,
      name: ing,
      amount: '',
    })),
    instructions,
    servings,
    prepTime,
    cookTime,
    difficulty,
    oxalatePerServing,
    totalOxalate: oxalatePerServing * servings,
    tags: ['ai-generated', 'low-oxalate'],
    source: 'chatbot' as const,
    isFavorite: false,
  };
};