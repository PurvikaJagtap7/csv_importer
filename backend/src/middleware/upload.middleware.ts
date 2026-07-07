import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Check extension and MIME type
    if (
      ext !== '.csv' &&
      mimeType !== 'text/csv' &&
      mimeType !== 'application/vnd.ms-excel'
    ) {
      const err = new Error('Only CSV files are allowed');
      (err as any).status = 400;
      return cb(err);
    }

    cb(null, true);
  },
});
