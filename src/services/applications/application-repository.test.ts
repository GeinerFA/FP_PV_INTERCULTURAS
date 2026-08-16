import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeStoredCurriculumSummary,
  normalizeStoredCurriculumUpload,
} from "./application-repository.ts";

function buildPdfBuffer() {
  return Buffer.from("%PDF-1.7\n1 0 obj\n", "utf8");
}

test("normalizeStoredCurriculumSummary keeps valid PDF metadata", () => {
  const summary = normalizeStoredCurriculumSummary({
    fileName: " resume.pdf ",
    contentType: " application/pdf ",
    sizeBytes: 1024,
    uploadedAt: new Date("2024-01-03T00:00:00.000Z"),
  });

  assert.deepEqual(summary, {
    fileName: "resume.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
    uploadedAt: "2024-01-03T00:00:00.000Z",
  });
});

test("normalizeStoredCurriculumSummary quarantines legacy non-PDF metadata", () => {
  const summary = normalizeStoredCurriculumSummary({
    fileName: "resume.docx",
    contentType: "application/msword",
    sizeBytes: 1024,
    uploadedAt: "2024-01-03T00:00:00.000Z",
  });

  assert.equal(summary, null);
});

test("normalizeStoredCurriculumSummary quarantines malformed curriculum metadata", () => {
  const summary = normalizeStoredCurriculumSummary({
    fileName: "resume.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
    uploadedAt: "not-a-date",
  });

  assert.equal(summary, null);
});

test("normalizeStoredCurriculumUpload quarantines records with a non-PDF signature", () => {
  const curriculum = normalizeStoredCurriculumUpload({
    fileName: "resume.pdf",
    contentType: "application/pdf",
    sizeBytes: 9,
    uploadedAt: new Date("2024-01-03T00:00:00.000Z"),
    data: Buffer.from("not-a-pdf", "utf8"),
  });

  assert.equal(curriculum, null);
});

test("normalizeStoredCurriculumUpload accepts valid PDF uploads", () => {
  const pdf = buildPdfBuffer();
  const curriculum = normalizeStoredCurriculumUpload({
    fileName: "resume.pdf",
    contentType: "application/pdf",
    sizeBytes: pdf.byteLength,
    uploadedAt: new Date("2024-01-03T00:00:00.000Z"),
    data: pdf,
  });

  assert.ok(curriculum);
  assert.equal(curriculum.fileName, "resume.pdf");
  assert.equal(curriculum.contentType, "application/pdf");
  assert.deepEqual(curriculum.data, pdf);
});
