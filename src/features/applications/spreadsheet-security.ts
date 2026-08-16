const spreadsheetFormulaDangerousLeadingCharacters = /^[=+\-@\t\r]/;

export function escapeSpreadsheetFormulaCellValue(value: string): string {
  return spreadsheetFormulaDangerousLeadingCharacters.test(value) ? `'${value}` : value;
}
