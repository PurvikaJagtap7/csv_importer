import { CrmRecord } from '../types/crm.types';
import { batcherService } from './batcher.service';
import { groqClientService } from './groqClient.service';

export class AiExtractorService {
  /**
   * Orchestrates batching and AI extraction via Groq.
   * TODO: Implement concurrent batch processing and API invocation
   */
  async extract(rows: any[]): Promise<Partial<CrmRecord>[]> {
    // TODO: Implement batch extraction logic
    return [];
  }
}

export const aiExtractorService = new AiExtractorService();
