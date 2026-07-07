import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

/**
 * POST /api/extract
 * Uploads a CSV file, runs AI extraction, and supports SSE progress events.
 */
router.post('/extract', uploadMiddleware.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // TODO: Implement CSV parsing, AI batch orchestration, validation, and SSE events
    res.status(200).json({
      message: 'Extraction started (stub response)',
      fileName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
});

export default router;
