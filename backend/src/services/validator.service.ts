import { CrmRecord, CrmStatus, DataSource } from '../types/crm.types';
import { applyCsvSafety } from './csvSafety.service';
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?[\d\s\-().]{7,15}\d)/g;

// ─────────────────────────────────────────
// 1. validateEnum
// ─────────────────────────────────────────

export function validateEnum<T extends string>(
  value: string | undefined,
  allowedList: T[]
): T | '' {
  if (!value) return '';
  const trimmed = value.trim() as T;
  return allowedList.includes(trimmed) ? trimmed : '';
}

// ─────────────────────────────────────────
// 2. normalizeDate
// ─────────────────────────────────────────

export function normalizeDate(rawValue: string | undefined): string {
  if (!rawValue || !rawValue.trim()) return '';

  const s = rawValue.trim();

  // Try common formats before handing to Date constructor

  // DD/MM/YYYY or DD-MM-YYYY
  const dmySlash = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`);
    if (!isNaN(candidate.getTime())) return candidate.toISOString();
  }

  // MM/DD/YYYY — only if day > 12, otherwise ambiguous; skip this override and fall through
  const mdySlash = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdySlash && parseInt(mdySlash[1]) > 12) {
    // already handled above as DMY; this branch covers clearly-month-first
    const [, m, d, y] = mdySlash;
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`);
    if (!isNaN(candidate.getTime())) return candidate.toISOString();
  }

  // YYYY/MM/DD or YYYY-MM-DD
  const ymdSlash = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdSlash) {
    const [, y, m, d] = ymdSlash;
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`);
    if (!isNaN(candidate.getTime())) return candidate.toISOString();
  }

  // Fallback: let JS Date try to parse it (handles ISO 8601, RFC strings, etc.)
  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) return fallback.toISOString();

  return '';
}

// ─────────────────────────────────────────
// 3. mergeMultiValue
// ─────────────────────────────────────────

export function mergeMultiValue(
  record: Partial<CrmRecord>,
  rawRowText: string
): Partial<CrmRecord> {
  const result = { ...record };
  const notes: string[] = result.crm_note ? [result.crm_note] : [];

  // Scan raw row for all emails
  const allEmails = Array.from(new Set(rawRowText.match(EMAIL_REGEX) ?? []));
  if (allEmails.length > 0) {
    if (!result.email) {
      result.email = allEmails[0];
    }
    const primaryEmail = result.email;
    const extraEmails = allEmails.filter(
      (e) => e.toLowerCase() !== primaryEmail.toLowerCase()
    );
    extraEmails.forEach((e) => notes.push(`Alt email: ${e}`));
  }

  // Scan raw row for all phone numbers
  // Strip non-numeric for deduplication and storage
  const rawPhones = (rawRowText.match(PHONE_REGEX) ?? []).filter((p) => {
    const cleanP = p.trim();
    // Reject if it looks like a date (e.g. YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY)
    if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(cleanP)) return false;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanP)) return false;
    return true;
  });
  const cleanedPhones = Array.from(
    new Set(rawPhones.map((p) => p.replace(/[\s\-().+]/g, '')))
  ).filter((p) => p.length >= 7);

  if (cleanedPhones.length > 0) {
    if (!result.mobile_without_country_code) {
      result.mobile_without_country_code = cleanedPhones[0];
    }
    const primaryMobile = result.mobile_without_country_code;
    const extraPhones = cleanedPhones.filter((p) => p !== primaryMobile);
    extraPhones.forEach((p) => notes.push(`Alt phone: ${p}`));
  }

  result.crm_note = notes.join(' | ') || undefined;
  return result;
}

// ─────────────────────────────────────────
// 4. shouldSkip
// ─────────────────────────────────────────

export function shouldSkip(record: Partial<CrmRecord>): boolean {
  const hasEmail = !!record.email?.trim();
  const hasMobile = !!record.mobile_without_country_code?.trim();
  return !hasEmail && !hasMobile;
}

// ─────────────────────────────────────────
// 5. validateRecord
// ─────────────────────────────────────────

const ALLOWED_CRM_STATUSES: CrmStatus[] = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

const ALLOWED_DATA_SOURCES: DataSource[] = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

export function validateRecord(
  aiRecord: any,
  rawRowText: string
): { record: CrmRecord; skip: boolean; skipReason?: string } {
  // 1. Start from AI output
  let partial: Partial<CrmRecord> = { ...aiRecord };

  // Normalization for name field if the AI returned it under a different key
  if (!partial.name) {
    const nameAliases = [
      'full_name',
      'fullName',
      'Lead Name',
      'lead_name',
      'Customer Name',
      'customer_name',
      'Name',
      'Contact Name',
      'contact_name',
      'Client Name',
      'client_name',
    ];
    for (const alias of nameAliases) {
      if ((aiRecord as any)[alias]) {
        partial.name = (aiRecord as any)[alias];
        break;
      }
    }
  }

  // Sanity check mobile_without_country_code
  if (partial.mobile_without_country_code) {
    const cleaned = partial.mobile_without_country_code.replace(/[\s\-().+]/g, '');
    const isValidPhone =
      /^\d{7,15}$/.test(cleaned) &&
      !/^\d{4}\d{2}\d{2}$/.test(cleaned) && // YYYYMMDD
      !/^\d{2}\d{2}\d{4}$/.test(cleaned); // DDMMYYYY
    if (!isValidPhone) {
      partial.mobile_without_country_code = undefined;
    }
  }

  // 2. Validate and sanitize enums
  partial.crm_status = validateEnum(partial.crm_status, ALLOWED_CRM_STATUSES) || undefined;
  partial.data_source = validateEnum(partial.data_source, ALLOWED_DATA_SOURCES) || undefined;

  // 3. Normalize date
  if (partial.created_at !== undefined) {
    partial.created_at = normalizeDate(partial.created_at) || undefined;
  }

  // 4. Merge multi-value emails/phones from raw row (safety net over AI output)
  partial = mergeMultiValue(partial, rawRowText);

  partial = applyCsvSafety(partial);
  // 5. Check skip rule
  if (shouldSkip(partial)) {
    return {
      record: partial as CrmRecord,
      skip: true,
      skipReason: 'Record has neither a valid email nor a mobile number',
    };
  }

  return { record: partial as CrmRecord, skip: false };
}
