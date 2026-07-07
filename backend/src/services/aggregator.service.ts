import { CrmRecord, ExtractResponse } from '../types/crm.types';

export class AggregatorService {
  /**
   * Aggregates processed batches into the final ExtractResponse.
   * TODO: Implement aggregation logic
   */
  aggregate(
    imported: CrmRecord[],
    skipped: { row: any; reason: string }[]
  ): ExtractResponse {
    // TODO: Implement actual aggregation and response shaping
    return {
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length
    };
  }
}

export const aggregatorService = new AggregatorService();
