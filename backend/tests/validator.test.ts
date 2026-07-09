import { validateRecord } from '../src/services/validator.service';

describe('ValidatorService', () => {
  it('should skip record if it has neither email nor mobile', () => {
    const aiRecord = {
      name: 'John Doe',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'eden_park',
    };
    const result = validateRecord(aiRecord, 'John Doe, , ');
    expect(result.skip).toBe(true);
    expect(result.skipReason).toBe('Record has neither a valid email nor a mobile number');
  });

  it('should merge multiple emails and phones by keeping first and writing rest to note', () => {
    const aiRecord = {
      name: 'John Doe',
      email: 'john@example.com',
      mobile_without_country_code: '1234567890',
    };
    const rawRowText = 'john@example.com, alt1@example.com, 1234567890, 9876543210';
    const result = validateRecord(aiRecord, rawRowText);
    expect(result.skip).toBe(false);
    expect(result.record.email).toBe('john@example.com');
    expect(result.record.mobile_without_country_code).toBe('1234567890');
    expect(result.record.crm_note).toBe('Alt email: alt1@example.com | Alt phone: 9876543210');
  });

  it('should reject invalid enum values and accept valid ones', () => {
    const aiRecord = {
      name: 'John Doe',
      email: 'john@example.com',
      crm_status: 'INVALID_STATUS',
      data_source: 'eden_park',
    };
    const result = validateRecord(aiRecord, 'john@example.com');
    expect(result.skip).toBe(false);
    expect(result.record.crm_status).toBeUndefined();
    expect(result.record.data_source).toBe('eden_park');
  });

  it('should sanitize formula injection characters in all text fields', () => {
    const aiRecord = {
      name: '=cmd|\'/c calc\'!A0',
      company: '+Company',
      city: '-City',
      state: '@State',
      country: '\tCountry',
      crm_note: '=Note',
      description: '=Desc',
      email: 'test@example.com'
    };
    const result = validateRecord(aiRecord, 'test@example.com');
    expect(result.record.name).toBe('\'=cmd|\'/c calc\'!A0');
    expect(result.record.company).toBe('\'+Company');
    expect(result.record.city).toBe('\'-City');
    expect(result.record.state).toBe('\'@State');
    expect(result.record.country).toBe('\'\tCountry');
    expect(result.record.crm_note).toBe('\'=Note');
    expect(result.record.description).toBe('\'=Desc');
  });
});

