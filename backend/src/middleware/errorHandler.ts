import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]:', err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Multer specific errors
  if (err instanceof multer.MulterError) {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size limit exceeded (Max 5MB)';
    }
  }

  res.status(status).json({
    error: message
  });
};
