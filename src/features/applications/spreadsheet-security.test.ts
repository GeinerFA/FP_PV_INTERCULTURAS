import assert from "node:assert/strict";
import test from "node:test";

import { escapeSpreadsheetFormulaCellValue } from "./spreadsheet-security.ts";

test("escapes dangerous spreadsheet formula prefixes", () => {
  assert.equal(escapeSpreadsheetFormulaCellValue("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(escapeSpreadsheetFormulaCellValue("+value"), "'+value");
  assert.equal(escapeSpreadsheetFormulaCellValue("-value"), "'-value");
  assert.equal(escapeSpreadsheetFormulaCellValue("@value"), "'@value");
  assert.equal(escapeSpreadsheetFormulaCellValue("\tvalue"), "'\tvalue");
  assert.equal(escapeSpreadsheetFormulaCellValue("\rvalue"), "'\rvalue");
  assert.equal(escapeSpreadsheetFormulaCellValue("safe value"), "safe value");
});
