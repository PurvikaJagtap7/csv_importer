import { parse } from 'csv-parse';
import iconv from 'iconv-lite';

export class CsvParserService {
  /**
   * Detects encoding, decodes the CSV file buffer, and parses it into row objects.
   * Handles empty files, all-blank rows, and duplicate header names.
   */
  async parseCsv(fileBuffer: Buffer): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    if (!fileBuffer || fileBuffer.length === 0) {
      return { headers: [], rows: [] };
    }

    // 1. Detect encoding (UTF-8 BOM / Windows-1252) and decode to UTF-8 string
    let csvContent = '';
    // UTF-8 BOM is 0xEF 0xBB 0xBF
    const hasUtf8Bom =
      fileBuffer.length >= 3 &&
      fileBuffer[0] === 0xEF &&
      fileBuffer[1] === 0xBB &&
      fileBuffer[2] === 0xBF;

    if (hasUtf8Bom) {
      csvContent = iconv.decode(fileBuffer.subarray(3), 'utf8');
    } else {
      // Decode as UTF-8 first and check if it has invalid UTF-8 sequences (replacement characters)
      const decodedUtf8 = iconv.decode(fileBuffer, 'utf8');
      if (!decodedUtf8.includes('\uFFFD')) {
        csvContent = decodedUtf8;
      } else {
        // Fallback to Windows-1252
        csvContent = iconv.decode(fileBuffer, 'windows-1252');
      }
    }

    // 2. Parse CSV string into 2D array (rows of cells)
    const records: string[][] = await new Promise((resolve, reject) => {
      parse(
        csvContent,
        {
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data || []);
        }
      );
    });

    if (records.length === 0) {
      return { headers: [], rows: [] };
    }

    // 3. Process headers (auto-detected from first row)
    const rawHeaders = records[0];
    const seen = new Map<string, number>();
    const cleanHeaders = rawHeaders.map((header, idx) => {
      let name = (header || '').trim();
      if (!name) {
        name = `column_${idx + 1}`;
      }
      const lowerName = name.toLowerCase();
      if (seen.has(lowerName)) {
        const count = seen.get(lowerName)! + 1;
        seen.set(lowerName, count);
        return `${name}_${count}`;
      } else {
        seen.set(lowerName, 0);
        return name;
      }
    });

    // 4. Map rows to objects, skipping all-blank rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < records.length; i++) {
      const rawRow = records[i];
      // Check if all cells in this row are empty/whitespace
      const isBlank = rawRow.every((cell) => !cell || cell.trim() === '');
      if (isBlank) continue;

      const rowObj: Record<string, string> = {};
      cleanHeaders.forEach((header, colIdx) => {
        rowObj[header] = (rawRow[colIdx] ?? '').trim();
      });
      rows.push(rowObj);
    }

    return { headers: cleanHeaders, rows };
  }
}

export const csvParserService = new CsvParserService();
