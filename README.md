# Meal Planner AI — Demo

A full-stack chatbot that builds personalized weekly meal prep plans. Enter your age, height, weight, goal, and budget — and the AI generates a 7-day plan with real recipes, accurate macros, and itemized costs pulled from the Spoonacular API, reasoned over by OpenAI GPT-4o.

## Setup

### 1. Get your API keys

**OpenAI** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

**Spoonacular** — [spoonacular.com/food-api](https://spoonacular.com/food-api) (free tier: 150 points/day)

### 2. Add them to `backend/.env`

```
OPENAI_API_KEY=sk-...your-key-here...
SPOONACULAR_API_KEY=your-spoonacular-key-here
PORT=3001
```

### 3. Start the backend

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### 4. Start the frontend (in a new terminal)

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How it works

1. Fill in your profile: age, height, weight, goal, and weekly food budget.
2. On your first message, the backend fetches real recipes from Spoonacular filtered to your goal and budget — including actual price-per-serving and macro data.
3. Those recipes are injected into the GPT-4o system prompt so the AI plans around real data instead of guessing.
4. Ask follow-up questions — substitutions, snacks, shopping lists, macros, etc.
5. Click **Start Over** to enter a new profile.

## Goals supported

| Goal | Recipe filter applied |
|---|---|
| Weight Loss | Max 550 kcal, min 20g protein per serving |
| Muscle Gain | Min 35g protein, min 450 kcal per serving |
| Maintenance | Max 700 kcal per serving |
| General Health | Whole30 diet, max 650 kcal per serving |

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4o (streaming)
- **Recipes & Nutrition**: Spoonacular API
