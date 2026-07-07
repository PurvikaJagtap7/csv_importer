import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { csvParserService } from '../services/csvParser.service';

const router = Router();

/**
 * POST /api/upload
 * Uploads a CSV file, parses it, and returns a preview of the raw rows.
 */
router.post('/upload', uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { headers, rows } = await csvParserService.parseCsv(req.file.buffer);

    res.status(200).json({
      totalRows: rows.length,
      headers,
      sampleRows: rows.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
