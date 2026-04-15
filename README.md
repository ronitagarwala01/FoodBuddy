# Meal Planner AI — Demo

A full-stack chatbot that builds personalized weekly meal prep plans using OpenAI GPT-4o.

## Setup

### 1. Add your OpenAI API key

Open `backend/.env` and replace the placeholder:

```
OPENAI_API_KEY=sk-...your-key-here...
```

### 2. Start the backend

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### 3. Start the frontend (in a new terminal)

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How it works

1. Fill in your profile: age, height, weight, goal, and weekly food budget.
2. The chat agent greets you and offers to build a 7-day meal prep plan.
3. Ask follow-up questions — substitutions, snacks, shopping lists, macros, etc.
4. Click **Start Over** to enter a new profile.

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4o (streaming)
