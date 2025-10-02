import { ClientPrefs } from '@/types/clientPrefs';

/**
 * CSV utility functions for Client Preferences
 */

export interface CSVImportResult {
  success: number;
  errors: string[];
  warnings: string[];
}

export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

/**
 * Validate a single client record from CSV
 */
export function validateClientRecord(
  record: Record<string, string>,
  rowIndex: number
): { isValid: boolean; errors: CSVValidationError[] } {
  const errors: CSVValidationError[] = [];

  // Required fields
  if (!record.id?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'id',
      value: record.id || '',
      message: 'ID is required'
    });
  }

  if (!record.name?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'name',
      value: record.name || '',
      message: 'Name is required'
    });
  }

  if (!record.priority?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'priority',
      value: record.priority || '',
      message: 'Priority is required'
    });
  } else if (!['High', 'Medium', 'Low'].includes(record.priority)) {
    errors.push({
      row: rowIndex,
      field: 'priority',
      value: record.priority,
      message: 'Priority must be High, Medium, or Low'
    });
  }

  // Validate fee
  if (!record['Client Repo Fee (USD)']?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'Client Repo Fee (USD)',
      value: record['Client Repo Fee (USD)'] || '',
      message: 'Client Repo Fee is required'
    });
  } else {
    const fee = parseFloat(record['Client Repo Fee (USD)']);
    if (isNaN(fee)) {
      errors.push({
        row: rowIndex,
        field: 'Client Repo Fee (USD)',
        value: record['Client Repo Fee (USD)'],
        message: 'Client Repo Fee must be a valid number'
      });
    } else if (fee < 0 || fee > 1000) {
      errors.push({
        row: rowIndex,
        field: 'Client Repo Fee (USD)',
        value: record['Client Repo Fee (USD)'],
        message: 'Client Repo Fee must be between 0 and 1000'
      });
    }
  }

  // Validate flatbed pre-approval
  const flatbedValue = record['Flatbed Pre Approved']?.trim().toLowerCase();
  if (flatbedValue && !['yes', 'no', 'true', 'false'].includes(flatbedValue)) {
    errors.push({
      row: rowIndex,
      field: 'Flatbed Pre Approved',
      value: record['Flatbed Pre Approved'],
      message: 'Flatbed Pre Approved must be Yes or No'
    });
  }

  // Validate keys required
  if (!record['Keys Required']?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'Keys Required',
      value: record['Keys Required'] || '',
      message: 'Keys Required is required'
    });
  } else if (!['Required', 'Preferred', 'Not Required'].includes(record['Keys Required'])) {
    errors.push({
      row: rowIndex,
      field: 'Keys Required',
      value: record['Keys Required'],
      message: 'Keys Required must be Required, Preferred, or Not Required'
    });
  }

  // Validate date format (optional)
  if (record['Updated At'] && record['Updated At'].trim()) {
    const date = new Date(record['Updated At']);
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: 'Updated At',
        value: record['Updated At'],
        message: 'Updated At must be a valid ISO date'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse CSV content and convert to ClientPrefs array
 */
export function parseCSVToClients(csvContent: string): {
  clients: ClientPrefs[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const clients: ClientPrefs[] = [];

  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    errors.push('CSV must contain at least a header row and one data row');
    return { clients, errors, warnings };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = [
    'ID',
    'Name',
    'Priority',
    'Client Repo Fee (USD)',
    'Flatbed Pre Approved',
    'Keys Required',
    'Notes',
    'Updated At',
    'Updated By'
  ];

  // Validate headers
  if (headers.length !== expectedHeaders.length) {
    errors.push(`Expected ${expectedHeaders.length} columns, got ${headers.length}`);
    return { clients, errors, warnings };
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      errors.push(`Expected header "${expectedHeaders[i]}" at column ${i + 1}, got "${headers[i]}"`);
    }
  }

  if (errors.length > 0) {
    return { clients, errors, warnings };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    
    if (values.length !== expectedHeaders.length) {
      errors.push(`Row ${i + 1}: Expected ${expectedHeaders.length} values, got ${values.length}`);
      continue;
    }

    // Create record object
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    // Validate record
    const validation = validateClientRecord(record, i + 1);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        errors.push(`Row ${error.row}: ${error.message}`);
      });
      continue;
    }

    // Convert to ClientPrefs
    try {
      const client: ClientPrefs = {
        id: record.ID.trim(),
        name: record.Name.trim(),
        priority: record.Priority as 'High' | 'Medium' | 'Low',
        clientRepoFeeUSD: parseFloat(record['Client Repo Fee (USD)']),
        flatbedPreApproved: ['yes', 'true'].includes(record['Flatbed Pre Approved'].toLowerCase()),
        keysRequired: record['Keys Required'] as 'Required' | 'Preferred' | 'Not Required',
        notes: record.Notes?.trim() || undefined,
        updatedAtISO: record['Updated At']?.trim() || new Date().toISOString(),
        updatedBy: record['Updated By']?.trim() || 'csv-import'
      };

      clients.push(client);
    } catch (error) {
      errors.push(`Row ${i + 1}: Failed to parse client data - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { clients, errors, warnings };
}

/**
 * Convert ClientPrefs array to CSV string
 */
export function clientsToCSV(clients: ClientPrefs[]): string {
  const headers = [
    'ID',
    'Name',
    'Priority',
    'Client Repo Fee (USD)',
    'Flatbed Pre Approved',
    'Keys Required',
    'Notes',
    'Updated At',
    'Updated By'
  ];

  const rows = clients.map(client => [
    client.id,
    client.name,
    client.priority,
    client.clientRepoFeeUSD.toString(),
    client.flatbedPreApproved ? 'Yes' : 'No',
    client.keysRequired,
    client.notes || '',
    client.updatedAtISO,
    client.updatedBy || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'client-preferences.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Generate CSV template for import
 */
export function generateCSVTemplate(): string {
  const headers = [
    'ID',
    'Name',
    'Priority',
    'Client Repo Fee (USD)',
    'Flatbed Pre Approved',
    'Keys Required',
    'Notes',
    'Updated At',
    'Updated By'
  ];

  const exampleRow = [
    'example-client',
    'Example Client Name',
    'Medium',
    '125',
    'Yes',
    'Required',
    'Example notes',
    new Date().toISOString(),
    'user-name'
  ];

  return [headers, exampleRow]
    .map(row => row.map(field => `"${String(field)}"`).join(','))
    .join('\n');
}
