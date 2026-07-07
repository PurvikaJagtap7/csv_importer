import { CrmRecord, ExtractResponse } from '../types/crm.types';

export interface BatchValidationResult {
  record: CrmRecord;
  skip: boolean;
  skipReason?: string;
  rawRow?: any;
}

/**
 * Flattens all per-batch validation results into the final ExtractResponse shape.
 * Records with skip=true go to skipped[], the rest go to imported[].
 */
export function aggregateResults(
  batchResults: BatchValidationResult[][]
): ExtractResponse {
  const imported: CrmRecord[] = [];
  const skipped: { row: any; reason: string }[] = [];

  for (const batch of batchResults) {
    for (const result of batch) {
      if (result.skip) {
        skipped.push({
          row: result.rawRow ?? result.record,
          reason: result.skipReason ?? 'Unknown reason',
        });
      } else {
        imported.push(result.record);
      }
    }
  }

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}
