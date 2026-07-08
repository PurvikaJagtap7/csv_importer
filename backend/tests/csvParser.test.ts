import { csvParserService } from '../src/services/csvParser.service';

describe('CsvParserService', () => {
  it('should parse a simple CSV file correctly', async () => {
    const csvBuffer = Buffer.from('Name,Phone,Email\nJohn Doe,9876543210,john@test.com');
    const { headers, rows } = await csvParserService.parseCsv(csvBuffer);

    expect(headers).toEqual(['Name', 'Phone', 'Email']);
    expect(rows.length).toBe(1);
    expect(rows[0]).toEqual({
      Name: 'John Doe',
      Phone: '9876543210',
      Email: 'john@test.com',
    });
  });

  it('should handle different encodings correctly', async () => {
    // UTF-8 BOM
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const csvDataUtf8 = Buffer.from('Name\nJohn');
    const fullBufferUtf8 = Buffer.concat([bom, csvDataUtf8]);

    const resultUtf8 = await csvParserService.parseCsv(fullBufferUtf8);
    expect(resultUtf8.headers).toEqual(['Name']);
    expect(resultUtf8.rows[0]).toEqual({ Name: 'John' });

    // Windows-1252 (e.g. accented character like 'é' is 0xE9 in Windows-1252, but invalid in UTF-8)
    const win1252Buffer = Buffer.from([0x4e, 0x61, 0x6d, 0x65, 0x0a, 0x52, 0xe9, 0x6e, 0xe9]); // "Name\nRéné"
    const resultWin = await csvParserService.parseCsv(win1252Buffer);
    expect(resultWin.headers).toEqual(['Name']);
    expect(resultWin.rows[0]).toEqual({ Name: 'Réné' });
  });
});
