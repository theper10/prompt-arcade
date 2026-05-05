# Prompt Arcade

Prompt Arcade is a full-stack web app that turns short text prompts into playable browser game cartridges.

Users can describe a game idea, generate a lightweight cartridge, play it directly in the browser, save favorite cartridges locally, and export cartridges as standalone HTML files.

## Live Demo

Try the static demo here:

https://theper10.github.io/prompt-arcade/

The live demo runs in static demo mode using local sample cartridges. For live backend-powered generation, run the project locally with your own API key.

## Features

- Prompt-driven game cartridge generation
- Sandboxed browser game runner
- Playable lightweight HTML/CSS/JavaScript games
- Save and load cartridges locally
- Export cartridges as standalone `.html` files
- Regenerate, repair, and simplify cartridges
- Adjustable difficulty and chaos settings
- Mock mode for local development without API calls
- Responsive arcade-inspired interface

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- OpenAI API
- Zod
- dotenv

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/theper10/prompt-arcade.git
cd prompt-arcade
```

### 2. Install dependencies

```bash
npm install
```

On Windows PowerShell, if script execution is blocked, use:

```powershell
npm.cmd install
```

### 3. Create a `.env` file

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
PORT=8787
VITE_AI_API_BASE=http://localhost:8787
USE_MOCK_AI=false
```

The real `.env` file should not be committed to GitHub.

For local development without API calls, enable mock mode:

```env
USE_MOCK_AI=true
PORT=8787
VITE_AI_API_BASE=http://localhost:8787
```

### 4. Run the app

Start the frontend and backend together:

```bash
npm run dev:full
```

On Windows PowerShell:

```powershell
npm.cmd run dev:full
```

The frontend usually runs at:

```text
http://localhost:5173
```

The backend runs at:

```text
http://localhost:8787
```

You can check the backend health endpoint at:

```text
http://localhost:8787/api/health
```

## Available Scripts

```bash
npm run dev
```

Runs the Vite frontend.

```bash
npm run server
```

Runs the Express backend.

```bash
npm run dev:full
```

Runs the frontend and backend together.

```bash
npm run build
```

Builds the app for production.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs linting if configured.

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | API key used by the backend |
| `OPENAI_MODEL` | Model used for cartridge generation |
| `PORT` | Backend server port |
| `VITE_AI_API_BASE` | Frontend URL for the backend API |
| `USE_MOCK_AI` | Enables mock cartridge generation without API calls |

## Mock Mode

Mock mode lets the app run without making external API calls.

Set this in `.env`:

```env
USE_MOCK_AI=true
```

Then run:

```bash
npm run dev:full
```

This is useful for testing the interface, demoing the app locally, or working without API credits.

## Runtime Safety

Cartridges run inside a sandboxed iframe instead of being injected directly into the React app.

The backend also validates generated cartridge content before sending it to the frontend. The API key is only used server-side and is never exposed in the browser.

The sandboxing approach is designed for local development and portfolio/demo usage.

## Exporting Cartridges

Generated cartridges can be exported as standalone HTML files.

This makes it possible to save a generated game and open it directly in a browser.

## Deployment

This project includes both a frontend and a backend.

Static hosting alone, such as GitHub Pages, is not enough for full functionality because cartridge generation requires a backend API.

Recommended deployment options include:

- Vercel
- Render
- Railway
- Fly.io
- Azure App Service
- Netlify with serverless functions

## What This Project Demonstrates

- Full-stack TypeScript development
- React application structure
- Express API design
- Environment-based configuration
- API integration
- Zod validation
- Sandboxed iframe execution
- Local persistence
- Responsive UI design
- Exportable browser-based artifacts

## License

MIT
