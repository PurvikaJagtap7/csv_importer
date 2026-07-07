export class BatcherService {
  /**
   * Batches raw rows into groups of a specific size.
   * TODO: Implement batching logic
   */
  batchRows<T>(rows: T[], batchSize: number): T[][] {
    // TODO: Implement actual batching logic
    return [];
  }
}

export const batcherService = new BatcherService();
