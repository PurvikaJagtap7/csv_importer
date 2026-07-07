import { CrmRecord } from '../types/crm.types';

export class ValidatorService {
  /**
   * Validates a CrmRecord candidate according to rules.
   * - Rules: must have either email or mobile, valid date, correct enums, etc.
   * TODO: Implement validation logic
   */
  validateRecord(record: Partial<CrmRecord>): { isValid: boolean; reason?: string } {
    // TODO: Implement actual validation rules
    return { isValid: true };
  }
}

export const validatorService = new ValidatorService();
