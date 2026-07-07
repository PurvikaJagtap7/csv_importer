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

/**
 * Applies sanitizeField + escapeLineBreaks specifically to crm_note and description,
 * the free-text fields most likely to contain injection characters or newlines.
 */
export function applyCsvSafety(record: Partial<CrmRecord>): Partial<CrmRecord> {
  const result = { ...record };

  if (result.crm_note) {
    result.crm_note = sanitizeField(escapeLineBreaks(result.crm_note));
  }
  if (result.description) {
    result.description = sanitizeField(escapeLineBreaks(result.description));
  }

  return result;
}
