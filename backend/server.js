import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { fetchRecipesForProfile, formatRecipesForPrompt } from './spoonacular.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(profile, recipes = []) {
  const { age, height, weight, goal, budget } = profile;

  const goalDescriptions = {
    weight_loss: 'weight loss (caloric deficit, high protein, low processed carbs)',
    muscle_gain: 'muscle gain (caloric surplus, high protein, strength-supporting macros)',
    maintenance: 'weight maintenance (balanced macros, sustainable eating habits)',
    general_health: 'general health and wellness (whole foods, balanced nutrition)',
  };

  const goalText = goalDescriptions[goal] || goal;
  const recipeContext = formatRecipesForPrompt(recipes);

  return `You are a professional nutritionist and meal prep coach. Here is the user's profile:
- Age: ${age} years old
- Height: ${height}
- Weight: ${weight}
- Goal: ${goalText}
- Weekly food budget: $${budget}

Your job is to create detailed, practical weekly meal prep plans tailored to this profile. When the user asks for a meal plan, provide:
1. A weekly overview (7 days, 3 meals + optional snacks per day)
2. Key recipes with brief instructions
3. Macro estimates (calories, protein, carbs, fat) per day — use the real data provided below where available
4. A consolidated grocery/shopping list with estimated costs to stay within the $${budget}/week budget — use the real price-per-serving data provided below

Keep your tone friendly, motivating, and practical. If the user asks follow-up questions about substitutions, allergies, or adjustments, answer helpfully based on their profile. Always stay within their stated budget.${recipeContext}`;
}

app.post('/api/chat', async (req, res) => {
  const { messages, profile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!profile) {
    return res.status(400).json({ error: 'profile is required' });
  }

  // Only fetch recipes on the first user message to avoid redundant API calls
  const isFirstMessage = messages.length === 1;
  let recipes = [];
  if (isFirstMessage) {
    try {
      recipes = await fetchRecipesForProfile(profile);
      console.log(`Fetched ${recipes.length} recipes from Spoonacular`);
    } catch (err) {
      console.warn('Spoonacular fetch failed, continuing without recipes:', err.message);
    }
  }

  const systemPrompt = buildSystemPrompt(profile, recipes);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 2048,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('OpenAI error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to connect to OpenAI' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Meal planner backend running on http://localhost:${PORT}`);
});
