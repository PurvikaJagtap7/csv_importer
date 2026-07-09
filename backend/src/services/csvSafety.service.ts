import { CrmRecord } from '../types/crm.types';

const FORMULA_INJECTION_CHARS = /^[=+\-@\t]/;

// ─────────────────────────────────────────
// 1. sanitizeField
// ─────────────────────────────────────────

/**
 * Prepends a single quote to fields that start with formula-injection characters
 * (=, +, -, @) to prevent spreadsheet formula execution if the CSV is re-exported.
 */
export function sanitizeField(value: string): string {
  if (!value) return value;
  if (FORMULA_INJECTION_CHARS.test(value)) {
    return `'${value}`;
  }
  return value;
}

// ─────────────────────────────────────────
// 2. escapeLineBreaks
// ─────────────────────────────────────────

/**
 * Replaces literal newline characters (\n, \r\n) with the escaped two-character
 * sequence \n so that CSV rows remain valid single-line entries.
 */
export function escapeLineBreaks(value: string): string {
  if (!value) return value;
  return value.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
}

// ─────────────────────────────────────────
// 3. applyCsvSafety
// ─────────────────────────────────────────

export function applyCsvSafety(record: Partial<CrmRecord>): Partial<CrmRecord> {
  const result = { ...record };

  const textFields: (keyof CrmRecord)[] = [
    'name',
    'company',
    'city',
    'state',
    'country',
    'lead_owner',
    'crm_note',
    'description',
  ];

  for (const field of textFields) {
    const val = result[field];
    if (typeof val === 'string' && val) {
      result[field] = sanitizeField(escapeLineBreaks(val)) as any;
    }
  }

  return result;
}
