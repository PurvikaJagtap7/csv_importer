import { CRM_EXTRACTION_PROMPT } from '../prompts/crmExtraction.prompt';
import { groqClientService } from './groqClient.service';

export class AiExtractorService {
  /**
   * Sends a single batch of raw rows to Groq and returns the parsed array of CRM records.
   * Throws a descriptive error if the response is not valid JSON or not an array.
   */
  async extractBatch(rows: any[]): Promise<any[]> {
    const rawResponse = await groqClientService.callGroq(CRM_EXTRACTION_PROMPT, rows);

    // groqClientService already parses and validates the array shape — just return it
    if (!Array.isArray(rawResponse)) {
      throw new Error(
        `AI extraction returned a non-array result: ${JSON.stringify(rawResponse)}`
      );
    }

    return rawResponse;
  }
}

export const aiExtractorService = new AiExtractorService();
