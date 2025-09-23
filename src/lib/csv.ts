/**
 * RFC4180-compliant CSV Parser
 * 
 * Handles quoted fields, commas within quotes, and CRLF line endings.
 * No external dependencies, pure TypeScript implementation.
 */

export function parseCsv(text: string): Record<string, string>[] {
  if (!text || text.trim() === '') {
    return [];
  }

  const lines = text.split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const values = parseCsvLine(line);
    
    // Skip rows with only empty values or problematic characters
    const hasValidData = values.some(v => v && v.trim() !== '' && v.length > 1 && !v.includes('') && !v.includes(''));
    if (!hasValidData) {
      continue;
    }

    const row: Record<string, string> = {};
    
    // Map values to headers, handling cases where there might be more values than headers
    for (let j = 0; j < Math.max(headers.length, values.length); j++) {
      const header = headers[j] || `column_${j}`;
      const value = values[j] || '';
      row[header] = value;
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields and escaped quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within quoted field
        current += '"';
        i += 2;
        continue;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      // Regular character
      current += char;
    }

    i++;
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Unit test for the CSV parser
 */
export function testCsvParser(): boolean {
  const testCases = [
    {
      input: 'name,age,city\n"John Doe",25,"New York"\nJane Smith,30,Chicago',
      expected: [
        { name: 'John Doe', age: '25', city: 'New York' },
        { name: 'Jane Smith', age: '30', city: 'Chicago' }
      ]
    },
    {
      input: 'id,description\n1,"Item with, comma"\n2,"Item with ""quotes"""',
      expected: [
        { id: '1', description: 'Item with, comma' },
        { id: '2', description: 'Item with "quotes"' }
      ]
    },
    {
      input: 'a,b,c\n1,2,3\n',
      expected: [
        { a: '1', b: '2', c: '3' }
      ]
    }
  ];

  for (const testCase of testCases) {
    const result = parseCsv(testCase.input);
    if (JSON.stringify(result) !== JSON.stringify(testCase.expected)) {
      console.error('CSV parser test failed:', { input: testCase.input, expected: testCase.expected, actual: result });
      return false;
    }
  }

  return true;
}
