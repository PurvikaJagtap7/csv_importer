import { Router, Request, Response } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { csvParserService } from '../services/csvParser.service';
import { batcherService } from '../services/batcher.service';
import { aiExtractorService } from '../services/aiExtractor.service';
import { validateRecord } from '../services/validator.service';
import { aggregateResults, BatchValidationResult } from '../services/aggregator.service';
import { retryWithBackoff } from '../utils/retry';

const router = Router();
const CONCURRENCY_LIMIT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Send a single SSE event. */
function sendEvent(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Processes all batches with bounded concurrency.
 * As each batch resolves (success or failed-after-retries) it calls onBatchDone
 * so the caller can stream progress immediately.
 */
async function processBatchesConcurrently(
  batches: any[][],
  onBatchDone: (batchIndex: number, result: BatchValidationResult[], status: 'done' | 'failed') => void
): Promise<BatchValidationResult[][]> {
  const results: BatchValidationResult[][] = new Array(batches.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const batchIndex = nextIndex++;
      if (batchIndex >= batches.length) break;
      const batch = batches[batchIndex];

      let batchResult: BatchValidationResult[];
      let status: 'done' | 'failed';

      try {
        const aiOutput = await retryWithBackoff(
          (currentBatch) => aiExtractorService.extractBatch(currentBatch || batch),
          2,
          batchIndex,
          (r) => Array.isArray(r),
          batch
        );

        batchResult = aiOutput.map((aiRecord, rowIdx) => {
          const rawRow = batch[rowIdx] ?? {};
          const rawRowText = JSON.stringify(rawRow);
          const { record, skip, skipReason } = validateRecord(aiRecord, rawRowText);
          return { record, skip, skipReason, rawRow };
        });
        status = 'done';
      } catch (err: any) {
        console.error(`[/api/extract] Batch #${batchIndex} failed after retries:`, err.message);
        batchResult = batch.map((rawRow) => ({
          record: rawRow as any,
          skip: true,
          skipReason: `AI extraction failed for this batch: ${err.message}`,
          rawRow,
        }));
        status = 'failed';
      }

      results[batchIndex] = batchResult;
      onBatchDone(batchIndex, batchResult, status);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, batches.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/extract
 * Default: Server-Sent Events streaming with per-batch progress events.
 * Pass ?stream=false to get a plain JSON response instead.
 */
router.post('/extract', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  const useStream = req.query.stream !== 'false';

  try {
    if (!req.file) {
      if (useStream) {
        // Can't use SSE yet — headers not sent, safe to send JSON error
        res.status(400).json({ error: 'No file uploaded' });
      } else {
        res.status(400).json({ error: 'No file uploaded' });
      }
      return;
    }

    // 1. Parse CSV
    const { rows } = await csvParserService.parseCsv(req.file.buffer);

    if (rows.length === 0) {
      res.status(400).json({ error: 'CSV file is empty or has no data rows' });
      return;
    }

    // 2. Split into batches
    const batches = batcherService.batchRows(rows);
    const totalBatches = batches.length;

    // ── SSE path ────────────────────────────────────────────────────────────
    if (useStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const batchResults = await processBatchesConcurrently(
        batches,
        (batchIndex, _result, status) => {
          sendEvent(res, { batchIndex, totalBatches, status });
        }
      );

      const finalResponse = aggregateResults(batchResults);

      sendEvent(res, { type: 'complete', result: finalResponse });
      res.end();
      return;
    }

    // ── Non-SSE JSON path (?stream=false) ───────────────────────────────────
    const batchResults = await processBatchesConcurrently(batches, () => {});
    const finalResponse = aggregateResults(batchResults);
    res.status(200).json(finalResponse);

  } catch (err: any) {
    console.error('[/api/extract error]:', err);

    if (res.headersSent) {
      // SSE stream already started — send error as an event then close
      sendEvent(res, { type: 'error', error: err?.message ?? 'Extraction failed' });
      res.end();
    } else {
      res.status(500).json({
        error: err?.message ?? 'Extraction failed. Check server logs for details.',
      });
    }
  }
});

export default router;
