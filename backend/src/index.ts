import express from 'express';
import { config } from './config/env.config';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler } from './middleware/errorHandler';
import uploadRouter from './routes/upload.route';
import extractRouter from './routes/extract.route';

const app = express();
const PORT = config.PORT;

// Standard middlewares
app.use(corsMiddleware);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Mount routes under /api
app.use('/api', uploadRouter);
app.use('/api', extractRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running in ${config.NODE_ENV} mode on port ${PORT}`);
});
