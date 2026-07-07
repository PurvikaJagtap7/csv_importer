import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { csvParserService } from '../services/csvParser.service';
import { batcherService } from '../services/batcher.service';
import { aiExtractorService } from '../services/aiExtractor.service';
import { validateRecord } from '../services/validator.service';
import { aggregateResults, BatchValidationResult } from '../services/aggregator.service';
import { retryWithBackoff } from '../utils/retry';

const router = Router();
const CONCURRENCY_LIMIT = 5;

/**
 * Runs an array of async tasks with a bounded concurrency limit.
 * At most `limit` tasks will be in-flight at any time.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= tasks.length) break;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * POST /api/extract
 * Full pipeline: parse CSV → split into batches → run AI extraction (bounded concurrency,
 * 2 retries per batch) → validate every record → aggregate and return final response.
 */
router.post('/extract', uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Parse CSV
    const { rows } = await csvParserService.parseCsv(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
    }

    // 2. Split into batches
    const batches = batcherService.batchRows(rows);

    // 3. Build one task per batch
    const batchTasks = batches.map((batch, batchIndex) => async (): Promise<BatchValidationResult[]> => {
      let aiOutput: any[];

      try {
        // Retry the AI call up to 2 times; require the result to be a non-empty array
        aiOutput = await retryWithBackoff(
          () => aiExtractorService.extractBatch(batch),
          2,
          batchIndex,
          (result) => Array.isArray(result)
        );
      } catch (err: any) {
        // All retries failed — mark every row in this batch as skipped
        console.error(`[/api/extract] Batch #${batchIndex} failed after retries:`, err.message);
        return batch.map((rawRow) => ({
          record: rawRow as any,
          skip: true,
          skipReason: `AI extraction failed for this batch: ${err.message}`,
          rawRow,
        }));
      }

      // 4. Validate each AI record against its original raw row
      return aiOutput.map((aiRecord, rowIdx) => {
        const rawRow = batch[rowIdx] ?? {};
        const rawRowText = JSON.stringify(rawRow);
        const { record, skip, skipReason } = validateRecord(aiRecord, rawRowText);
        return { record, skip, skipReason, rawRow };
      });
    });

    // 5. Run all batch tasks with bounded concurrency
    const batchResults = await runWithConcurrency(batchTasks, CONCURRENCY_LIMIT);

    // 6. Aggregate into final response
    const response = aggregateResults(batchResults);

    return res.status(200).json(response);
  } catch (err: any) {
    console.error('[/api/extract error]:', err);
    return res.status(500).json({
      error: err?.message || 'Extraction failed. Check server logs for details.',
    });
  }
});

export default router;
