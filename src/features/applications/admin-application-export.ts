import "server-only";

import type { PDFFont } from "pdf-lib";

import type { AdminApplicationListFilters } from "@/features/applications/admin-application-list-filters";
import type { Application, ApplicationChangeActor, ApplicationStatus, ApplicationTypeCode } from "@/types/application";

export type AdminApplicationExportCopy = {
  title: string;
  summaryTitle: string;
  generatedAtLabel: string;
  filtersLabel: string;
  noFiltersLabel: string;
  resultCountLabel: string;
  worksheetName: string;
  applicationHeading: string;
  statusesSummaryLabel: string;
  exportUnavailableMessage: string;
  fields: {
    id: string;
    status: string;
    applicationType: string;
    applicationTypeCode: string;
    applicationTypeName: string;
    submittedAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    residenceCountry: string;
    residenceCity: string;
    birthDate: string;
    identityDocument: string;
    availability: string;
    message: string;
    curriculum: string;
    curriculumFileName: string;
    curriculumContentType: string;
    curriculumSize: string;
    curriculumUploadedAt: string;
    statusHistory: string;
    applicationTypeHistory: string;
  };
  filters: {
    query: string;
    status: string;
    applicationType: string;
    from: string;
    to: string;
  };
  placeholders: {
    empty: string;
    none: string;
    available: string;
  };
  statuses: Record<ApplicationStatus, string>;
  applicationTypes: Record<ApplicationTypeCode, string>;
};

type ExportRow = Record<string, string | number>;

type PdfContext = {
  copy: AdminApplicationExportCopy;
  locale: string;
  applications: Application[];
  filters: AdminApplicationListFilters;
};

const pdfTextReplacements: Record<string, string> = {
  "\u00a0": " ",
  "\u2010": "-",
  "\u2011": "-",
  "\u2012": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2015": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201a": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u201e": '"',
  "\u2022": "*",
  "\u2026": "...",
  "\u2190": "<-",
  "\u2192": "->",
  "\u2194": "<->",
};

const pdfPage = {
  width: 612,
  height: 792,
  marginX: 48,
  marginTop: 56,
  marginBottom: 52,
};

function formatDateTime(value: string, locale: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatDateOnly(value: string | null, locale: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatChangedBy(actor: ApplicationChangeActor, fallback: string): string {
  if (!actor) {
    return fallback;
  }

  if (actor.email) {
    return actor.email;
  }

  return actor.role ?? actor.userId ?? fallback;
}

function formatCurriculumSummary(
  application: Application,
  copy: AdminApplicationExportCopy,
  locale: string,
): string {
  if (!application.curriculum) {
    return copy.placeholders.none;
  }

  return [
    application.curriculum.fileName,
    application.curriculum.contentType,
    formatFileSize(application.curriculum.sizeBytes),
    `${copy.fields.curriculumUploadedAt}: ${formatDateTime(application.curriculum.uploadedAt, locale)}`,
    copy.placeholders.available,
  ].join(" · ");
}

function formatStatusHistory(application: Application, copy: AdminApplicationExportCopy, locale: string): string {
  if (application.statusHistory.length === 0) {
    return copy.placeholders.none;
  }

  return application.statusHistory
    .map((entry) => {
      const fromLabel = entry.from ? copy.statuses[entry.from] : copy.placeholders.none;
      const toLabel = copy.statuses[entry.to];
      const reason = entry.reason ?? copy.placeholders.empty;

      return [
        `${fromLabel} → ${toLabel}`,
        formatDateTime(entry.changedAt, locale),
        formatChangedBy(entry.changedBy, copy.placeholders.empty),
        reason,
      ].join(" | ");
    })
    .join("\n");
}

function formatApplicationTypeHistory(application: Application, copy: AdminApplicationExportCopy, locale: string): string {
  if (application.applicationTypeHistory.length === 0) {
    return copy.placeholders.none;
  }

  return application.applicationTypeHistory
    .map((entry) => {
      const fromLabel = entry.from?.name ?? copy.placeholders.none;
      const toLabel = entry.to.name;
      const reason = entry.reason ?? copy.placeholders.empty;

      return [
        `${fromLabel} → ${toLabel}`,
        formatDateTime(entry.changedAt, locale),
        formatChangedBy(entry.changedBy, copy.placeholders.empty),
        reason,
      ].join(" | ");
    })
    .join("\n");
}

function formatFilters(filters: AdminApplicationListFilters, copy: AdminApplicationExportCopy, locale: string): string {
  const parts: string[] = [];

  if (filters.query) {
    parts.push(`${copy.filters.query}: ${filters.query}`);
  }

  if (filters.status) {
    parts.push(`${copy.filters.status}: ${copy.statuses[filters.status]}`);
  }

  if (filters.applicationType) {
    parts.push(`${copy.filters.applicationType}: ${copy.applicationTypes[filters.applicationType]}`);
  }

  if (filters.from) {
    parts.push(`${copy.filters.from}: ${formatDateOnly(filters.from, locale, filters.from)}`);
  }

  if (filters.to) {
    parts.push(`${copy.filters.to}: ${formatDateOnly(filters.to, locale, filters.to)}`);
  }

  return parts.length > 0 ? parts.join(" · ") : copy.noFiltersLabel;
}

function buildExportRows(
  applications: Application[],
  copy: AdminApplicationExportCopy,
  locale: string,
): ExportRow[] {
  return applications.map((application) => ({
    [copy.fields.id]: application.id,
    [copy.fields.status]: copy.statuses[application.status],
    [copy.fields.applicationType]: copy.applicationTypes[application.applicationType.code],
    [copy.fields.applicationTypeCode]: application.applicationType.code,
    [copy.fields.applicationTypeName]: application.applicationType.name,
    [copy.fields.submittedAt]: formatDateTime(application.createdAt, locale),
    [copy.fields.updatedAt]: formatDateTime(application.updatedAt, locale),
    [copy.fields.firstName]: application.firstName,
    [copy.fields.lastName]: application.lastName,
    [copy.fields.fullName]: application.fullName,
    [copy.fields.email]: application.email,
    [copy.fields.phone]: application.phone,
    [copy.fields.nationality]: application.nationality,
    [copy.fields.residenceCountry]: application.residenceCountry ?? copy.placeholders.empty,
    [copy.fields.residenceCity]: application.residenceCity ?? copy.placeholders.empty,
    [copy.fields.birthDate]: formatDateOnly(application.birthDate, locale, copy.placeholders.empty),
    [copy.fields.identityDocument]: application.identityDocument ?? copy.placeholders.empty,
    [copy.fields.availability]: application.availability ?? copy.placeholders.empty,
    [copy.fields.message]: application.message ?? copy.placeholders.empty,
    [copy.fields.curriculum]: formatCurriculumSummary(application, copy, locale),
    [copy.fields.curriculumFileName]: application.curriculum?.fileName ?? copy.placeholders.empty,
    [copy.fields.curriculumContentType]: application.curriculum?.contentType ?? copy.placeholders.empty,
    [copy.fields.curriculumSize]: application.curriculum ? formatFileSize(application.curriculum.sizeBytes) : copy.placeholders.empty,
    [copy.fields.curriculumUploadedAt]: application.curriculum
      ? formatDateTime(application.curriculum.uploadedAt, locale)
      : copy.placeholders.empty,
    [copy.fields.statusHistory]: formatStatusHistory(application, copy, locale),
    [copy.fields.applicationTypeHistory]: formatApplicationTypeHistory(application, copy, locale),
  }));
}

export async function buildAdminApplicationsWorkbook(context: PdfContext): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const rows = buildExportRows(context.applications, context.copy, context.locale);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.min(42, Math.max(key.length + 4, 18)),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, context.copy.worksheetName.slice(0, 31));

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true }) as Buffer;
}

function canEncodePdfText(font: PDFFont, value: string): boolean {
  try {
    font.encodeText(value);
    return true;
  } catch {
    return false;
  }
}

function sanitizePdfText(text: string, font: PDFFont): string {
  let sanitized = "";

  for (const character of text) {
    if (character === "\n" || character === "\r" || character === "\t") {
      sanitized += character;
      continue;
    }

    const replacedCharacter = pdfTextReplacements[character] ?? character;

    if (canEncodePdfText(font, replacedCharacter)) {
      sanitized += replacedCharacter;
      continue;
    }

    const normalizedCharacter = replacedCharacter.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

    if (normalizedCharacter && canEncodePdfText(font, normalizedCharacter)) {
      sanitized += normalizedCharacter;
      continue;
    }

    sanitized += "?";
  }

  return sanitized;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = sanitizePdfText(text, font).replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];

    for (const word of words.slice(1)) {
      const candidate = `${currentLine} ${word}`;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

function getBlockHeight(lines: string[], lineHeight: number): number {
  if (lines.length === 0) {
    return lineHeight;
  }

  return lines.length * lineHeight;
}

export async function buildAdminApplicationsPdf(context: PdfContext): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfColors = {
    title: rgb(0.05, 0.15, 0.12),
    body: rgb(0.2, 0.24, 0.31),
    subtle: rgb(0.38, 0.44, 0.52),
    accent: rgb(0.05, 0.47, 0.39),
    border: rgb(0.82, 0.89, 0.87),
    panel: rgb(0.96, 0.99, 0.98),
  };
  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([pdfPage.width, pdfPage.height]);
  let cursorY = pdfPage.height - pdfPage.marginTop;
  const maxWidth = pdfPage.width - pdfPage.marginX * 2;

  const ensureSpace = (height: number) => {
    if (cursorY - height >= pdfPage.marginBottom) {
      return;
    }

    page = document.addPage([pdfPage.width, pdfPage.height]);
    cursorY = pdfPage.height - pdfPage.marginTop;
  };

  const drawWrappedText = (
    text: string,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
    lineHeight: number,
    x = pdfPage.marginX,
  ) => {
    const lines = wrapText(text, font, size, maxWidth - (x - pdfPage.marginX));
    const blockHeight = getBlockHeight(lines, lineHeight);
    ensureSpace(blockHeight);

    for (const line of lines) {
      page.drawText(line, {
        x,
        y: cursorY,
        size,
        font,
        color,
      });

      cursorY -= lineHeight;
    }

    return blockHeight;
  };

  const drawField = (label: string, value: string) => {
    const labelHeight = 14;
    const valueLines = wrapText(value, regularFont, 11, maxWidth - 16);
    const valueHeight = getBlockHeight(valueLines, 15);
    const blockHeight = labelHeight + valueHeight + 12;
    ensureSpace(blockHeight + 8);

    page.drawText(sanitizePdfText(label, boldFont), {
      x: pdfPage.marginX + 8,
      y: cursorY,
      size: 10,
      font: boldFont,
      color: pdfColors.subtle,
    });
    cursorY -= labelHeight;

    for (const line of valueLines) {
      page.drawText(line, {
        x: pdfPage.marginX + 8,
        y: cursorY,
        size: 11,
        font: regularFont,
        color: pdfColors.body,
      });
      cursorY -= 15;
    }

    cursorY -= 12;
  };

  const drawDivider = () => {
    ensureSpace(14);
    page.drawLine({
      start: { x: pdfPage.marginX, y: cursorY },
      end: { x: pdfPage.width - pdfPage.marginX, y: cursorY },
      color: pdfColors.border,
      thickness: 1,
    });
    cursorY -= 14;
  };

  page.drawText(sanitizePdfText(context.copy.title, boldFont), {
    x: pdfPage.marginX,
    y: cursorY,
    size: 22,
    font: boldFont,
    color: pdfColors.title,
  });
  cursorY -= 28;

  const summaryLines = [
    `${context.copy.generatedAtLabel}: ${formatDateTime(new Date().toISOString(), context.locale)}`,
    `${context.copy.filtersLabel}: ${formatFilters(context.filters, context.copy, context.locale)}`,
    `${context.copy.resultCountLabel}: ${context.applications.length}`,
    `${context.copy.statusesSummaryLabel}: ${Object.entries(
      context.copy.statuses,
    )
      .map(([status, label]) => `${label} ${context.applications.filter((application) => application.status === status).length}`)
      .join(" · ")}`,
  ];

  page.drawRectangle({
    x: pdfPage.marginX,
    y: cursorY - 76,
    width: maxWidth,
    height: 86,
    color: pdfColors.panel,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });

  page.drawText(sanitizePdfText(context.copy.summaryTitle, boldFont), {
    x: pdfPage.marginX + 12,
    y: cursorY - 16,
    size: 12,
    font: boldFont,
    color: pdfColors.accent,
  });

  let summaryY = cursorY - 34;
  for (const line of summaryLines) {
    page.drawText(sanitizePdfText(line, regularFont), {
      x: pdfPage.marginX + 12,
      y: summaryY,
      size: 10,
      font: regularFont,
      color: pdfColors.body,
      maxWidth: maxWidth - 24,
      lineHeight: 13,
    });
    summaryY -= 15;
  }

  cursorY -= 106;

  context.applications.forEach((application, index) => {
    ensureSpace(44);
    page.drawText(sanitizePdfText(`${context.copy.applicationHeading} ${index + 1}`, boldFont), {
      x: pdfPage.marginX,
      y: cursorY,
      size: 10,
      font: boldFont,
      color: pdfColors.accent,
    });
    cursorY -= 16;

    drawWrappedText(application.fullName, boldFont, 16, pdfColors.title, 20);
    cursorY -= 4;

    drawField(context.copy.fields.id, application.id);
    drawField(context.copy.fields.status, context.copy.statuses[application.status]);
    drawField(context.copy.fields.applicationType, context.copy.applicationTypes[application.applicationType.code]);
    drawField(context.copy.fields.applicationTypeCode, application.applicationType.code);
    drawField(context.copy.fields.applicationTypeName, application.applicationType.name);
    drawField(context.copy.fields.submittedAt, formatDateTime(application.createdAt, context.locale));
    drawField(context.copy.fields.updatedAt, formatDateTime(application.updatedAt, context.locale));
    drawField(context.copy.fields.firstName, application.firstName || context.copy.placeholders.empty);
    drawField(context.copy.fields.lastName, application.lastName || context.copy.placeholders.empty);
    drawField(context.copy.fields.fullName, application.fullName || context.copy.placeholders.empty);
    drawField(context.copy.fields.email, application.email || context.copy.placeholders.empty);
    drawField(context.copy.fields.phone, application.phone || context.copy.placeholders.empty);
    drawField(context.copy.fields.nationality, application.nationality || context.copy.placeholders.empty);
    drawField(context.copy.fields.residenceCountry, application.residenceCountry ?? context.copy.placeholders.empty);
    drawField(context.copy.fields.residenceCity, application.residenceCity ?? context.copy.placeholders.empty);
    drawField(
      context.copy.fields.birthDate,
      formatDateOnly(application.birthDate, context.locale, context.copy.placeholders.empty),
    );
    drawField(context.copy.fields.identityDocument, application.identityDocument ?? context.copy.placeholders.empty);
    drawField(context.copy.fields.availability, application.availability ?? context.copy.placeholders.empty);
    drawField(context.copy.fields.message, application.message ?? context.copy.placeholders.empty);
    drawField(context.copy.fields.curriculum, formatCurriculumSummary(application, context.copy, context.locale));
    drawField(context.copy.fields.statusHistory, formatStatusHistory(application, context.copy, context.locale));
    drawField(
      context.copy.fields.applicationTypeHistory,
      formatApplicationTypeHistory(application, context.copy, context.locale),
    );

    if (index < context.applications.length - 1) {
      drawDivider();
    }
  });

  return document.save();
}

export function buildAdminApplicationsExportFileName(extension: "pdf" | "xlsx"): string {
  const stamp = new Date().toISOString().slice(0, 10);

  return `admin-applications-export-${stamp}.${extension}`;
}
