# GrowEasy AI CSV Importer

An intelligent CSV field mapping tool built on Next.js, Express, TypeScript, and the Groq API. It takes CSV files of varying layouts, parses and groups them, runs AI-based schema mapping, runs extensive validation, and imports valid records into a fixed CRM schema while keeping a clear audit of skipped items.

## Architecture

- **AI Proposes, Code Validates:** The Groq API (using `openai/gpt-oss-120b` with JSON mode) does the fuzzy mapping of unstructured headers and rows into candidate CRM records. Code then runs a deterministic quality gate layer validating enums, normalizing dates, de-duplicating fields, and enforcing safety rules.
- **Safety Gate:** Line break escaping and formula injection protection are applied to free-text columns before export.
- **SSE Progress Streaming:** Large files are batched and processed concurrently with a bounded concurrency pool. Real-time status events are streamed to the frontend via Server-Sent Events (SSE).

---

## Setup & Running Locally

### Prerequisites

Create a `.env` file inside the `backend/` directory:
```env
PORT=4000
GROQ_API_KEY=your_groq_api_key_here
BATCH_SIZE=20
```

### Local Development

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the UI.

3. **Running Tests:**
   ```bash
   cd backend
   npm test
   ```

---

## Running with Docker Compose

Build and run both services simultaneously:

```bash
# Set your Groq API Key as an environment variable
$env:GROQ_API_KEY="your_gsk_key" # PowerShell
# or export GROQ_API_KEY="your_gsk_key" # Unix/Bash

docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

---

## Implemented Bonus Features

- **Server-Sent Events (SSE):** Per-batch live progress events streamed directly to the frontend.
- **Deterministic Quality Gates:** Strict fallback checks, enums validations, date conversion, and de-duplication.
- **CSV Safety:** Automatic formula-injection (`=`, `+`, `-`, `@`) escaping and newline normalization.
- **Shadcn/UI & Theme System:** Premium look with native system light/dark mode styling.
