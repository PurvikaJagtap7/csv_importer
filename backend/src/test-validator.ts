import { validateRecord } from './services/validator.service';
import {
    sanitizeField,
    applyCsvSafety,
} from './services/csvSafety.service';

const fakeAiRecord = {
    name: 'John Doe',
    email: '',
    mobile_without_country_code: '',
    crm_status: 'INVALID_STATUS',
    data_source: 'random_source',
    created_at: 'not-a-date',
    crm_note: '=SUM(A1)',
    description: 'Hello\nWorld',
};

const rawRow =
    'John Doe, john@test.com, alt@test.com, 9876543210, 9999999999';

console.log('----- sanitizeField -----');
console.log(sanitizeField('=SUM(A1)'));

console.log('\n----- applyCsvSafety -----');
console.log(
    applyCsvSafety({
        crm_note: '=SUM(A1)',
        description: 'Hello\nWorld',
    })
);

console.log('\n----- validateRecord -----');

const result = validateRecord(fakeAiRecord, rawRow);

console.log(result.record.crm_note);
console.log(result.record.crm_note?.charCodeAt(0));

console.log('\ncrm_status:', result.record.crm_status);
console.log('data_source:', result.record.data_source);
console.log('created_at:', result.record.created_at);