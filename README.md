# Prompt Arcade

Prompt Arcade is an AI-powered web app that turns a short prompt into a tiny playable browser game cartridge.

Type something like "make me a cozy vampire fishing game" or "sad robot gardening simulator", and the app asks a local backend to generate self-contained HTML, CSS, and JavaScript. The frontend boots that cartridge in a sandboxed iframe, lets you repair crashes, save favorites, and export standalone HTML files.

## Features

- Prompt-to-game generation through a Node/Express API and the OpenAI Responses API.
- Structured cartridge metadata: title, subtitle, description, controls, objective, win/lose states, tags, and code.
- Sandboxed iframe runner using `sandbox="allow-scripts"` with no `allow-same-origin`.
- Server-side Zod request validation and output validation.
- Server-side sanitizer checks for network calls, storage APIs, imports, script tags, inline event handlers, external CSS URLs, and other unsafe browser APIs.
- One automatic repair attempt when model output fails validation.
- Manual "Repair with AI" flow for runtime crashes.
- In-memory IP rate limit: 20 generation requests per hour.
- Mock AI mode for demos and local QA without API credits.
- Local saved cartridge gallery using `localStorage`.
- Standalone HTML export for generated and saved cartridges.
- Polished responsive arcade/lab interface built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS through `@tailwindcss/vite`
- Node
- Express
- OpenAI official npm package
- Zod
- dotenv
- cors
- localStorage

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Set your server-side OpenAI key in `.env`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=8787
VITE_AI_API_BASE=http://localhost:8787
USE_MOCK_AI=false
```

Run the frontend and backend together:

```bash
npm run dev:full
```

Then open the Vite URL shown in your terminal, usually `http://localhost:5173`.

## Scripts

```bash
npm run dev       # Vite frontend only
npm run server    # Express API with tsx watch
npm run dev:full  # API and frontend together
npm run build     # TypeScript build plus Vite production build
npm run preview   # Preview the built frontend
```

## Environment Variables

`OPENAI_API_KEY`

Server-only OpenAI API key. Never exposed to the frontend.

`PORT`

Express API port. Defaults to `8787`.

`VITE_AI_API_BASE`

Frontend API base URL. Defaults to `http://localhost:8787`.

`USE_MOCK_AI`

Set to `true` to return a deterministic mock canvas cartridge without calling OpenAI.

`OPENAI_MODEL`

Optional. Defaults to `gpt-4.1-mini` if unset.

## Mock Mode

Mock mode is useful when you want to test the app without an API key or without spending API credits:

```bash
USE_MOCK_AI=true npm run dev:full
```

On Windows PowerShell:

```powershell
$env:USE_MOCK_AI="true"; npm run dev:full
```

The mock cartridge is still rendered through the same iframe, save, export, and repair UI paths.

## API

Health check:

```http
GET /api/health
```

Generate cartridge:

```http
POST /api/generate-cartridge
Content-Type: application/json

{
  "prompt": "cozy vampire fishing game",
  "chaos": 42,
  "difficulty": "normal"
}
```

Repair context can be included:

```json
{
  "prompt": "cozy vampire fishing game",
  "chaos": 42,
  "difficulty": "normal",
  "repairContext": {
    "previousTitle": "Moonlit Bite Fishing",
    "previousJs": "previous cartridge JavaScript",
    "errorMessage": "Cannot read properties of null"
  }
}
```

Errors return a consistent shape:

```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "The arcade backend needs an OPENAI_API_KEY before it can generate games."
  }
}
```

## Security Model

Prompt Arcade treats generated game code as untrusted.

The backend validates and sanitizes model output before returning it to the browser. It rejects obvious unsafe content such as network APIs, storage APIs, imports, script tags, inline event handlers, navigation APIs, and external CSS loading.

The frontend never injects generated JavaScript into React. It builds a complete iframe document and runs it with:

```html
<iframe sandbox="allow-scripts"></iframe>
```

It intentionally does not add `allow-same-origin`.

This is meaningful defense in depth for a portfolio app, not a claim of perfect isolation. For production with untrusted public traffic, add deeper HTML/CSS/JS parsing, durable abuse controls, observability, and deployment-level isolation.

## Limitations

- Generated games are intentionally tiny browser cartridges, not large game projects.
- AI output can still be buggy, repetitive, or oddly balanced.
- The repair flow can improve many crashes but is not guaranteed.
- Saved cartridges are local to the browser and capped at 20 items.
- The in-memory rate limiter resets when the server restarts.
- No database or user accounts are included.

## Deployment Notes

This project has both a static frontend and a backend API. GitHub Pages alone is not enough for AI generation because it only hosts static frontend files and cannot keep `OPENAI_API_KEY` server-side.

Good deployment targets include:

- Vercel
- Render
- Railway
- Fly.io
- Azure App Service
- Netlify with functions

For deployment, configure the backend environment variables on the hosting provider and point `VITE_AI_API_BASE` at the deployed API URL.

## Portfolio Talking Points

- Full-stack TypeScript product with a clean React/Vite frontend and Express API.
- Uses OpenAI structured JSON output and validates every cartridge before display.
- Demonstrates practical AI safety boundaries: server-side key handling, sanitizer checks, iframe sandboxing, and no direct generated-code execution in React.
- Includes real product details: mock mode, rate limiting, friendly errors, saved local gallery, export, repair flow, loading states, and responsive UI polish.
- Designed as a standalone project that can be run locally with one command.
