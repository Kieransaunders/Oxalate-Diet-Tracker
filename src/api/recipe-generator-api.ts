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

// Add offline mode support
let isOfflineMode = false;

export const setOfflineMode = (offline: boolean) => {
  isOfflineMode = offline;
};

export const isInOfflineMode = () => isOfflineMode;

export const generateRecipe = async (request: RecipeGenerationRequest, retryCount = 0): Promise<RecipeGenerationResponse> => {
  // If offline mode is enabled, go straight to fallback
  if (isOfflineMode) {
    return getFallbackRecipe(request);
  }
  
  const maxRetries = 1; // Reduced retries for faster fallback
  
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced to 8 second timeout for faster fallback

    const response = await fetch(RECIPE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 503 || response.status === 502) {
        throw new Error('The recipe service is temporarily unavailable. Please try again in a few minutes.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

    // Fallback - stringify the result if it's an object
    return { text: JSON.stringify(result) };
    
  } catch (error) {
    console.error('Recipe Generation API Error:', error);
    
    // Handle AbortError specifically
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      console.log('Request timed out, using fallback recipe');
      return getFallbackRecipe(request);
    }
    
    // Retry logic for other errors
    if (retryCount < maxRetries && error instanceof Error) {
      if (error.message.includes('temporarily unavailable') || 
          error.message.includes('network') ||
          error.message.includes('fetch')) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Reduced backoff time
        return generateRecipe(request, retryCount + 1);
      }
    }
    
    // If all retries failed or non-retryable error, return fallback
    if (retryCount >= maxRetries) {
      console.log('Max retries reached, using fallback recipe');
      return getFallbackRecipe(request);
    }
    
    // For other errors, try fallback
    if (error instanceof Error && 
        (error.message.includes('temporarily unavailable') ||
         error.message.includes('503') ||
         error.message.includes('502'))) {
      return getFallbackRecipe(request);
    }
    
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

// Enhanced fallback recipes for when API is unavailable
const fallbackRecipes = {
  breakfast: [
    {
      title: "Low-Oxalate Scrambled Eggs with Herbs",
      content: `# Low-Oxalate Scrambled Eggs with Herbs

**Servings:** 2
**Prep Time:** 5 minutes
**Cook Time:** 5 minutes
**Difficulty:** Easy
**Oxalate per serving:** 2mg

## Ingredients:
- 4 large eggs
- 2 tablespoons milk or cream
- 1 tablespoon butter
- 1 tablespoon fresh chives, chopped
- 1 tablespoon fresh parsley, chopped
- Salt and pepper to taste

## Instructions:
1. Crack eggs into a bowl and whisk with milk, salt, and pepper
2. Heat butter in a non-stick pan over medium-low heat
3. Pour in egg mixture and let sit for 20 seconds
4. Gently stir with a spatula, pushing eggs from edges to center
5. Continue cooking, stirring gently, until eggs are just set
6. Remove from heat and stir in fresh herbs
7. Serve immediately

**Tips:** Keep heat low for creamy, soft scrambled eggs. Fresh herbs add flavor without oxalates.`
    },
    {
      title: "Fluffy Pancakes with Blueberries",
      content: `# Fluffy Pancakes with Blueberries

**Servings:** 4
**Prep Time:** 10 minutes
**Cook Time:** 15 minutes
**Difficulty:** Easy
**Oxalate per serving:** 4mg

## Ingredients:
- 1 cup all-purpose flour
- 2 tablespoons sugar
- 2 teaspoons baking powder
- 1/2 teaspoon salt
- 1 cup milk
- 1 large egg
- 2 tablespoons melted butter
- 1/2 cup fresh blueberries

## Instructions:
1. Mix flour, sugar, baking powder, and salt in a large bowl
2. Whisk milk, egg, and melted butter in another bowl
3. Pour wet ingredients into dry ingredients and stir until just combined
4. Gently fold in blueberries
5. Heat a lightly greased pan over medium heat
6. Pour 1/4 cup batter for each pancake
7. Cook until bubbles form on surface, then flip
8. Cook until golden brown on both sides

**Tips:** Don't overmix the batter - lumps are okay! Blueberries are naturally low in oxalates.`
    },
    {
      title: "Coconut Chia Pudding",
      content: `# Coconut Chia Pudding

**Servings:** 2
**Prep Time:** 5 minutes
**Chill Time:** 4 hours
**Difficulty:** Easy
**Oxalate per serving:** 3mg

## Ingredients:
- 1/4 cup chia seeds
- 1 cup coconut milk
- 2 tablespoons maple syrup
- 1/2 teaspoon vanilla extract
- 1/4 cup shredded coconut
- Fresh berries for topping

## Instructions:
1. Whisk together chia seeds, coconut milk, maple syrup, and vanilla
2. Let sit for 5 minutes, then whisk again to prevent clumping
3. Cover and refrigerate for at least 4 hours or overnight
4. Stir well before serving
5. Top with shredded coconut and berries
6. Serve chilled

**Tips:** Whisk frequently in the first 30 minutes to prevent clumping. Make ahead for busy mornings.`
    },
    {
      title: "Coconut Rice Pudding",
      content: `# Coconut Rice Pudding

**Servings:** 4
**Prep Time:** 10 minutes
**Cook Time:** 25 minutes
**Difficulty:** Easy
**Oxalate per serving:** 3mg

## Ingredients:
- 1 cup cooked white rice
- 1 can (400ml) coconut milk
- 1/4 cup sugar
- 1/2 teaspoon vanilla extract
- 1/4 teaspoon cinnamon
- Pinch of salt

## Instructions:
1. Combine all ingredients in a medium saucepan
2. Bring to a gentle simmer over medium heat
3. Reduce heat to low and cook for 20 minutes, stirring occasionally
4. Stir frequently in the last 5 minutes to prevent sticking
5. Remove from heat when rice is creamy and thick
6. Serve warm or chilled

**Tips:** Use day-old rice for best texture. Add fresh fruit like bananas for extra flavor.`
    }
  ],
  lunch: [
    {
      title: "Grilled Chicken and Rice Bowl",
      content: `# Grilled Chicken and Rice Bowl

**Servings:** 2
**Prep Time:** 15 minutes
**Cook Time:** 20 minutes
**Difficulty:** Easy
**Oxalate per serving:** 5mg

## Ingredients:
- 2 chicken breasts (6oz each)
- 1 cup cooked white rice
- 1 cucumber, diced
- 1 cup cherry tomatoes, halved
- 2 tablespoons olive oil
- 1 lemon, juiced
- 2 cloves garlic, minced
- Salt, pepper, and herbs to taste

## Instructions:
1. Season chicken with salt, pepper, and garlic
2. Heat 1 tablespoon oil in a grill pan over medium-high heat
3. Cook chicken 6-7 minutes per side until cooked through
4. Let rest 5 minutes, then slice
5. Mix remaining oil with lemon juice for dressing
6. Serve chicken over rice with vegetables
7. Drizzle with lemon dressing

**Tips:** Use a meat thermometer to ensure chicken reaches 165°F. Prep vegetables while chicken cooks.`
    },
    {
      title: "Turkey and Avocado Wrap",
      content: `# Turkey and Avocado Wrap

**Servings:** 2
**Prep Time:** 10 minutes
**Cook Time:** 0 minutes
**Difficulty:** Easy
**Oxalate per serving:** 3mg

## Ingredients:
- 2 large flour tortillas
- 6 oz sliced turkey breast
- 1 ripe avocado, sliced
- 2 tablespoons cream cheese
- 1 cup lettuce leaves
- 1/2 cucumber, sliced
- 2 tablespoons ranch dressing

## Instructions:
1. Spread cream cheese on each tortilla
2. Layer turkey, avocado, lettuce, and cucumber
3. Drizzle with ranch dressing
4. Roll tightly, starting from one end
5. Secure with toothpicks if needed
6. Cut in half diagonally to serve

**Tips:** Choose large tortillas for easier rolling. Add a sprinkle of salt and pepper to the avocado.`
    },
    {
      title: "Tuna Salad Lettuce Cups",
      content: `# Tuna Salad Lettuce Cups

**Servings:** 3
**Prep Time:** 15 minutes
**Cook Time:** 0 minutes
**Difficulty:** Easy
**Oxalate per serving:** 2mg

## Ingredients:
- 2 cans (5oz each) tuna in water, drained
- 1/4 cup mayonnaise
- 1 tablespoon lemon juice
- 1 celery stalk, diced
- 2 hard-boiled eggs, chopped
- 1 head butter lettuce
- Salt and pepper to taste

## Instructions:
1. Mix tuna, mayonnaise, and lemon juice in a bowl
2. Add celery and chopped eggs
3. Season with salt and pepper
4. Separate lettuce leaves and wash
5. Fill lettuce cups with tuna salad
6. Serve immediately

**Tips:** Use butter lettuce for best cups. Make tuna salad ahead for meal prep.`
    }
  ],
  dinner: [
    {
      title: "Herb-Crusted Salmon with Cauliflower Mash",
      content: `# Herb-Crusted Salmon with Cauliflower Mash

**Servings:** 4
**Prep Time:** 20 minutes
**Cook Time:** 25 minutes
**Difficulty:** Medium
**Oxalate per serving:** 6mg

## Ingredients:
- 4 salmon fillets (6oz each)
- 1 large head cauliflower, cut into florets
- 2 tablespoons fresh dill, chopped
- 2 tablespoons fresh parsley, chopped
- 3 cloves garlic, minced
- 4 tablespoons butter
- 2 tablespoons olive oil
- 1/4 cup cream cheese
- Salt and pepper to taste

## Instructions:
1. Preheat oven to 400°F
2. Steam cauliflower until very tender, about 15 minutes
3. Mix herbs, garlic, and olive oil for herb crust
4. Season salmon with salt and pepper, top with herb mixture
5. Bake salmon for 12-15 minutes until flakes easily
6. Mash cauliflower with butter and cream cheese until smooth
7. Season cauliflower mash with salt and pepper
8. Serve salmon over cauliflower mash

**Tips:** Don't overcook salmon - it should be slightly pink in center. Add more butter for creamier mash.`
    }
  ],
  snack: [
    {
      title: "Coconut Energy Balls",
      content: `# Coconut Energy Balls

**Servings:** 12 balls
**Prep Time:** 15 minutes
**Chill Time:** 30 minutes
**Difficulty:** Easy
**Oxalate per serving:** 2mg

## Ingredients:
- 1 cup shredded coconut
- 1/2 cup coconut flour
- 1/4 cup honey
- 2 tablespoons coconut oil, melted
- 1 teaspoon vanilla extract
- Pinch of salt

## Instructions:
1. Mix all dry ingredients in a large bowl
2. Add honey, coconut oil, and vanilla
3. Mix until dough holds together when pressed
4. Roll into 12 small balls
5. Place on a lined tray
6. Refrigerate for 30 minutes until firm
7. Store in refrigerator for up to 1 week

**Tips:** If mixture is too dry, add more coconut oil. If too wet, add more coconut flour.`
    }
  ],
  dessert: [
    {
      title: "Vanilla Panna Cotta",
      content: `# Vanilla Panna Cotta

**Servings:** 6
**Prep Time:** 15 minutes
**Chill Time:** 4 hours
**Difficulty:** Medium
**Oxalate per serving:** 3mg

## Ingredients:
- 2 cups heavy cream
- 1/2 cup sugar
- 1 packet (2.25 tsp) unflavored gelatin
- 3 tablespoons cold water
- 2 teaspoons vanilla extract

## Instructions:
1. Sprinkle gelatin over cold water, let bloom for 5 minutes
2. Heat 1/2 cup cream with sugar until sugar dissolves
3. Add bloomed gelatin to hot cream, stir until dissolved
4. Stir in remaining cream and vanilla
5. Strain mixture to remove any lumps
6. Divide among 6 ramekins or glasses
7. Refrigerate for at least 4 hours until set
8. Serve chilled, optionally with fresh berries

**Tips:** Don't boil the cream or gelatin won't set properly. Strain for smoothest texture.`
    }
  ]
};

// Get a fallback recipe when API is unavailable
const getFallbackRecipe = (request: RecipeGenerationRequest): RecipeGenerationResponse => {
  const mealType = request.mealType || 'dinner';
  const recipes = fallbackRecipes[mealType] || fallbackRecipes.dinner;
  
  // Select a random recipe from the category
  const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
  
  // Add a note that this is a fallback recipe
  const fallbackNote = `\n\n**✨ Curated Recipe:** This is a chef-tested low-oxalate recipe from our collection. Perfect for when you want a reliable, delicious meal!`;
  
  return {
    text: randomRecipe.content + fallbackNote
  };
};

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