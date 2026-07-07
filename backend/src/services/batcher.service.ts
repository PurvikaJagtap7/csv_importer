import { config } from '../config/env.config';

export class BatcherService {
  /**
   * Batches raw rows into groups of a specific size.
   * If batchSize is not provided, defaults to BATCH_SIZE from config.
   */
  batchRows<T>(rows: T[], batchSize?: number): T[][] {
    const size = batchSize ?? config.BATCH_SIZE;
    if (size <= 0) {
      return [rows];
    }

    const batches: T[][] = [];
    for (let i = 0; i < rows.length; i += size) {
      batches.push(rows.slice(i, i + size));
    }
    return batches;
  }
}

export const batcherService = new BatcherService();
