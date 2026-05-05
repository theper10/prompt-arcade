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