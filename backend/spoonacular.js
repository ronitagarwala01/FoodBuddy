const BASE_URL = 'https://api.spoonacular.com';

/**
 * Maps a user goal to Spoonacular nutrient/diet query params.
 */
function goalToParams(goal) {
  switch (goal) {
    case 'weight_loss':
      return { maxCalories: 550, minProtein: 20 };
    case 'muscle_gain':
      return { minProtein: 35, minCalories: 450 };
    case 'maintenance':
      return { maxCalories: 700 };
    case 'general_health':
      return { diet: 'whole30', maxCalories: 650 };
    default:
      return {};
  }
}

/**
 * Fetch recipes from Spoonacular suited to the user's goal.
 * Returns an array of simplified recipe objects.
 */
export async function fetchRecipesForProfile(profile) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.warn('SPOONACULAR_API_KEY not set — skipping recipe fetch');
    return [];
  }

  const { goal, budget } = profile;
  const goalParams = goalToParams(goal);

  const maxPriceCentsPerServing = Math.round((budget / 21) * 100);

  const params = new URLSearchParams({
    apiKey,
    number: 14,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    sort: 'healthiness',
    maxReadyTime: 60,
    ...goalParams,
  });

  const url = `${BASE_URL}/recipes/complexSearch?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular error ${res.status}: ${text}`);
  }

  const data = await res.json();

  return (data.results || [])
    .filter((r) => !r.pricePerServing || r.pricePerServing <= maxPriceCentsPerServing)
    .map((r) => {
      const nutrients = r.nutrition?.nutrients || [];
      const get = (name) => nutrients.find((n) => n.name === name)?.amount ?? null;

      return {
        id: r.id,
        title: r.title,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        pricePerServingUSD: r.pricePerServing ? (r.pricePerServing / 100).toFixed(2) : null,
        sourceUrl: r.sourceUrl || null,
        calories: get('Calories'),
        protein: get('Protein'),
        carbs: get('Carbohydrates'),
        fat: get('Fat'),
        summary: r.summary
          ? r.summary.replace(/<[^>]+>/g, '').slice(0, 200)
          : null,
      };
    });
}

/**
 * Format the recipe list into a readable block for the system prompt.
 */
export function formatRecipesForPrompt(recipes) {
  if (!recipes.length) return '';

  const lines = recipes.map((r, i) => {
    const price = r.pricePerServingUSD ? `$${r.pricePerServingUSD}/serving` : 'price unknown';
    const macros = [
      r.calories != null ? `${Math.round(r.calories)} kcal` : null,
      r.protein != null ? `${Math.round(r.protein)}g protein` : null,
      r.carbs != null ? `${Math.round(r.carbs)}g carbs` : null,
      r.fat != null ? `${Math.round(r.fat)}g fat` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return `${i + 1}. **${r.title}** — ${price} | ${r.readyInMinutes} min | ${macros}`;
  });

  return `\n\nHere are real recipes from Spoonacular that fit this user's goal and budget. Use these as the basis for the meal plan where possible. Reference their actual prices and macros when discussing costs and nutrition:\n\n${lines.join('\n')}`;
}
