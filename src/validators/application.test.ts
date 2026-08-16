import assert from "node:assert/strict";
import test from "node:test";

import {
  hasApplicationCurriculumPdfSignature,
  isApplicationCurriculumPdfMetadata,
  safeParseApplicationCurriculumSummary,
  parseApplicationSubmission,
  safeParseApplicationSubmission,
} from "./application.ts";

function buildSubmission(curriculum?: Record<string, unknown> | null) {
  return {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+50688887777",
    nationality: "Costa Rica",
    birthDate: "2024-01-02T00:00:00.000Z",
    message: null,
    availability: null,
    curriculum,
  };
}

function buildPdfBuffer() {
  return Buffer.from("%PDF-1.7\n1 0 obj\n", "utf8");
}

test("curriculum metadata allows only .pdf files with application/pdf MIME", () => {
  assert.equal(isApplicationCurriculumPdfMetadata("resume.pdf", "application/pdf"), true);
  assert.equal(isApplicationCurriculumPdfMetadata("resume.docx", "application/pdf"), false);
  assert.equal(isApplicationCurriculumPdfMetadata("resume.pdf", "application/msword"), false);
  assert.equal(isApplicationCurriculumPdfMetadata("resume.pdf", ""), false);
});

test("curriculum signature detection recognizes PDF headers", () => {
  assert.equal(hasApplicationCurriculumPdfSignature(buildPdfBuffer()), true);
  assert.equal(hasApplicationCurriculumPdfSignature(Buffer.from("not-a-pdf", "utf8")), false);
});

test("parseApplicationSubmission accepts a valid PDF curriculum upload", () => {
  const submission = parseApplicationSubmission(
    buildSubmission({
      fileName: "resume.pdf",
      contentType: "application/pdf",
      sizeBytes: buildPdfBuffer().byteLength,
      uploadedAt: "2024-01-03T00:00:00.000Z",
      data: buildPdfBuffer(),
    }),
  );

  assert.equal(submission.curriculum?.fileName, "resume.pdf");
  assert.equal(submission.curriculum?.contentType, "application/pdf");
});

test("parseApplicationSubmission rejects curriculum uploads with an empty MIME type", () => {
  const result = safeParseApplicationSubmission(
    buildSubmission({
      fileName: "resume.pdf",
      contentType: "",
      sizeBytes: buildPdfBuffer().byteLength,
      uploadedAt: "2024-01-03T00:00:00.000Z",
      data: buildPdfBuffer(),
    }),
  );

  assert.equal(result.success, false);
  assert.match(result.error, /curriculum.contentType must be a non-empty string/);
});

test("parseApplicationSubmission rejects curriculum uploads when extension and MIME disagree", () => {
  const result = safeParseApplicationSubmission(
    buildSubmission({
      fileName: "resume.docx",
      contentType: "application/pdf",
      sizeBytes: buildPdfBuffer().byteLength,
      uploadedAt: "2024-01-03T00:00:00.000Z",
      data: buildPdfBuffer(),
    }),
  );

  assert.equal(result.success, false);
  assert.match(result.error, /curriculum must be a PDF upload/);
});

test("parseApplicationSubmission rejects curriculum uploads whose bytes are not a PDF", () => {
  const result = safeParseApplicationSubmission(
    buildSubmission({
      fileName: "resume.pdf",
      contentType: "application/pdf",
      sizeBytes: 9,
      uploadedAt: "2024-01-03T00:00:00.000Z",
      data: Buffer.from("not-a-pdf", "utf8"),
    }),
  );

  assert.equal(result.success, false);
  assert.match(result.error, /curriculum.data must contain a PDF file signature/);
});

test("safeParseApplicationCurriculumSummary rejects non-PDF legacy metadata", () => {
  const result = safeParseApplicationCurriculumSummary({
    fileName: "resume.docx",
    contentType: "application/msword",
    sizeBytes: 1024,
    uploadedAt: "2024-01-03T00:00:00.000Z",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /must be a PDF upload/);
});
