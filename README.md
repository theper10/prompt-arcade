# Prompt Arcade

Prompt Arcade is a full-stack web application that turns a short text prompt into a playable browser-based game cartridge.

Users describe a game idea, generate a lightweight cartridge, play it directly in the browser, save favorite cartridges locally, and export generated cartridges as standalone HTML files.

## Features

- Prompt-based game cartridge generation
- Sandboxed iframe game runner
- Lightweight browser games using HTML, CSS, and JavaScript
- Cartridge repair/regeneration flow
- Saved cartridge gallery using localStorage
- Export cartridges as standalone `.html` files
- Copyable game summaries
- Adjustable chaos and difficulty settings
- Mock mode for local development without API usage
- Responsive arcade-inspired interface
- Backend validation and safety checks for generated code

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- localStorage

### Backend

- Node.js
- Express
- TypeScript
- OpenAI API
- Zod
- dotenv
- CORS

## Project Structure

```text
server/
  index.ts
  openaiClient.ts
  prompt.ts
  sanitizer.ts
  schemas.ts
  rateLimit.ts
  mockCartridge.ts

src/
  App.tsx
  main.tsx
  index.css
  components/
  lib/
  types/
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
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

### 3. Create an environment file

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
PORT=8787
VITE_AI_API_BASE=http://localhost:8787
USE_MOCK_AI=false
```

For local development without API calls, use mock mode:

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

The frontend will usually run at:

```text
http://localhost:5173
```

The backend will run at:

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

Runs frontend and backend together.

```bash
npm run build
```

Builds the frontend for production.

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
| `OPENAI_API_KEY` | API key used by the backend to request cartridge generation |
| `OPENAI_MODEL` | Model used for generation |
| `PORT` | Backend server port |
| `VITE_AI_API_BASE` | Frontend URL for the backend API |
| `USE_MOCK_AI` | Enables mock cartridge generation without API calls |

## Mock Mode

Mock mode lets you run the project without using external API calls.

Set this in `.env`:

```env
USE_MOCK_AI=true
```

Then run:

```bash
npm run dev:full
```

This is useful for demos, development, and testing the interface without consuming API credits.

## Security Model

Generated cartridges run inside a sandboxed iframe.

The app uses several layers of protection:

- The API key is only used on the backend
- Generated cartridge code is never injected into the React app directly
- Cartridges run inside an iframe with restricted sandbox permissions
- Server-side validation checks generated HTML, CSS, and JavaScript
- Suspicious browser APIs and external resource loading are blocked
- The app supports cartridge crash handling and repair

This is intended as a practical sandboxing approach for a portfolio-scale project. A production system that runs untrusted code at scale would require additional isolation and security hardening.

## Cartridge Export

Generated cartridges can be exported as standalone HTML files.

This allows a generated game to be saved and opened directly in a browser.

## Deployment Notes

This project includes both a frontend and a backend.

Static hosting alone, such as GitHub Pages, is not enough for full functionality because cartridge generation requires a backend API.

Recommended deployment options:

- Vercel
- Render
- Railway
- Fly.io
- Azure App Service
- Netlify with serverless functions

For a simple portfolio deployment, host the frontend and backend together on a platform that supports Node.js servers.

## Portfolio Notes

This project demonstrates:

- Full-stack TypeScript development
- React application architecture
- Express API design
- Environment-based configuration
- API integration
- Runtime validation with Zod
- Sandboxed iframe execution
- Defensive handling of generated code
- Local persistence
- Responsive UI design
- Exportable browser-based artifacts

## License

MIT
