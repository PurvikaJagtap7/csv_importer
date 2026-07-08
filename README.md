# GrowEasy AI CSV Importer

An AI-powered CSV importer that ingests leads from any CSV layout (Facebook exports,
Google Ads exports, CRM exports, manual sheets) and maps them into GrowEasy's fixed
CRM schema — regardless of column naming or structure. The hard problem isn't parsing
the CSV, it's reliably mapping arbitrary, inconsistent columns to a fixed schema.

## Architecture: AI proposes, code validates

1. **Client-side preview** (Papaparse) — instant, no AI call, nothing hits the backend until Confirm
2. **Server-side re-parse** (csv-parse, never trusts the client) — encoding auto-corrected (UTF-8 BOM / Windows-1252 via iconv-lite)
3. **Batching** — rows split into ~20-row batches, dispatched with bounded concurrency (5–10 in flight)
4. **AI extraction** (Groq, `openai/gpt-oss-120b`, JSON mode) — strict system prompt with the CRM schema, enum lists, and few-shot examples for ambiguous headers
5. **Validation layer (the quality gate)** — AI output is never trusted directly:
   - Enum re-validation (`crm_status`, `data_source`) — invalid values blanked in code
   - Date normalization to ISO 8601, validated with `new Date()`
   - Independent regex scan for multiple emails/phones — first kept, rest merged into `crm_note`
   - Hard skip rule: no email AND no mobile → moved to `skipped[]`
   - CSV/formula-injection sanitization and line-break escaping
6. **Aggregation** — `{ imported[], skipped[], totalImported, totalSkipped }`
7. **Real-time progress** — SSE streams per-batch status to the frontend

## CRM schema

`created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description`

Allowed `crm_status`: `GOOD_LEAD_FOLLOW_UP` | `DID_NOT_CONNECT` | `BAD_LEAD` | `SALE_DONE`
Allowed `data_source`: `leads_on_demand` | `meridian_tower` | `eden_park` | `varah_swamy` | `sarjapur_plots` (blank if no confident match)

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, react-dropzone, Papaparse, react-window |
| Backend | Node.js, Express, TypeScript, multer, csv-parse, iconv-lite |
| AI | Groq API — `openai/gpt-oss-120b` (JSON mode) |
| Testing | Jest |
| Deployment | Vercel (frontend), Render (backend) |

## Setup

**`backend/.env`:**
```env
PORT=4000
GROQ_API_KEY=your_groq_api_key_here
BATCH_SIZE=20
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Run locally:**
```bash
cd backend && npm install && npm run dev   # http://localhost:4000
cd frontend && npm install && npm run dev  # http://localhost:3000
```

**Run tests:**
```bash
cd backend && npm test
```

**Run with Docker Compose:**
```bash
export GROQ_API_KEY="your_gsk_key"   # or $env:GROQ_API_KEY on PowerShell
docker-compose up --build
```

## API

`GET /api/health` → `{ status: "ok", uptime, timestamp }`

`POST /api/extract` (multipart/form-data, field: `file`) — streams SSE progress events, then:
```json
{
  "imported": [ /* CrmRecord[] */ ],
  "skipped": [ { "row": {}, "reason": "string" } ],
  "totalImported": 0,
  "totalSkipped": 0
}
```
Pass `?stream=false` for a plain JSON response instead of SSE.

## Bonus features implemented

Drag & drop upload, SSE progress streaming, retry mechanism (2 retries per failed batch, isolated), virtualized tables for large CSVs, dark mode, Jest unit tests, Docker Compose, deployed on Vercel + Render.

## Known limitations

- Free-tier Groq rate limits (~8K TPM) may throttle very large files; `BATCH_SIZE` is configurable via env var to tune for this
- Stateless by design — no database, no import history across requests

## Submission

Applying for: **Software Developer Intern**
Live app: [url] | GitHub: [url]
