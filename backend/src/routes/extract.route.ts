import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { csvParserService } from '../services/csvParser.service';
import { batcherService } from '../services/batcher.service';
import { aiExtractorService } from '../services/aiExtractor.service';

const router = Router();

/**
 * POST /api/extract
 * Single-batch live test: parses CSV, takes first 20 rows, runs AI extraction,
 * and returns the raw AI output for inspection.
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

    // 2. Take only first batch (single-batch test)
    const batches = batcherService.batchRows(rows);
    const firstBatch = batches[0];

    // 3. Call AI extractor
    const rawAiOutput = await aiExtractorService.extractBatch(firstBatch);

    // 4. Return raw output for inspection
    return res.status(200).json({ rawAiOutput });
  } catch (err: any) {
    console.error('[/api/extract error]:', err);
    return res.status(500).json({
      error: err?.message || 'Groq extraction failed. Check server logs for details.',
    });
  }
});

export default router;
