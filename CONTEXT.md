# GrowEasy AI CSV Importer — Intelligent Field Mapping Architecture

## Goal
Upload any CSV (varying column names/layouts) → AI maps fields to fixed CRM schema → return structured JSON.

## Stack
Frontend: Next.js | Backend: Node.js + Express + TypeScript | AI: Groq (or OpenAI/Gemini/Claude)

## CRM Fields (fixed output schema)
created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description

## Enums (AI must only use these, else leave blank)
crm_status: GOOD_LEAD_FOLLOW_UP | DID_NOT_CONNECT | BAD_LEAD | SALE_DONE
data_source: leads_on_demand | meridian_tower | eden_park | varah_swamy | sarjapur_plots

## AI Rules
- created_at must be parseable by `new Date(created_at)` (ISO 8601 preferred)
- Multiple emails/mobiles: keep first in its field, append rest to crm_note
- Skip record if it has NEITHER email NOR mobile
- Never invent enum values not in the lists above

## API Contract (LOCKED — do not change without updating this file)
POST /api/extract
  - multipart/form-data, field name: "file" (CSV)
  - Server re-parses CSV itself, never trusts client-parsed data
  - Batches rows into groups of ~20-50
  - Max 5-10 batches in flight concurrently (Promise.all with concurrency cap)
  - Up to 2 retries per failed/malformed batch, isolated — doesn't block other batches

Response:
{
  imported: CrmRecord[],
  skipped: { row: any, reason: string }[],
  totalImported: number,
  totalSkipped: number
}

(Optional SSE progress channel, event shape: { batchIndex, totalBatches, status })

## Folder Structure
backend/src/{routes, services, types, config}/
  services: csvParser, batcher, aiExtraction, validator, aggregator

## Build Order (do NOT skip ahead)
1. Scaffold (done)
2. CSV parse endpoint (no AI)
3. Batcher service
4. AI extraction (single batch test)
5. Validator/quality-gate layer
6. Aggregator + response shape
7. Retry logic
8. SSE progress events
9. Frontend wiring
10. Deploy + README