import path from "node:path";

import type { EmailMessage } from "./email-provider.ts";

const BRANDING_IMAGE_CID = "pvi-email-branding";
const BRANDING_IMAGE_FILENAME = "marca-agua-correo.png";
const BRANDING_IMAGE_PATH = path.join(process.cwd(), "public/branding", BRANDING_IMAGE_FILENAME);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderParagraphs(text: string): string {
  return text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#334155;">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export function renderBrandedEmailTemplate({
  subject,
  text,
}: Pick<EmailMessage, "subject" | "text">): Pick<EmailMessage, "html" | "attachments"> {
  const safeSubject = escapeHtml(subject);
  const html = `
    <div style="margin:0; padding:32px 16px; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:640px; margin:0 auto; position:relative; overflow:hidden; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; box-shadow:0 18px 45px -30px rgba(15,23,42,0.35);">
        <div style="padding:28px 32px 20px; background:linear-gradient(135deg, #ecfdf5 0%, #ffffff 52%, #fff7ed 100%); border-bottom:1px solid #e2e8f0; text-align:center;">
          <img
            src="cid:${BRANDING_IMAGE_CID}"
            alt="Pura Vida Interculturas"
            width="200"
            style="display:block; margin:0 auto 18px; max-width:200px; height:auto;"
          />
          <p style="margin:0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#0f766e; font-weight:700;">Pura Vida Interculturas</p>
          <h1 style="margin:14px 0 0; font-size:28px; line-height:1.2; color:#0f172a; font-weight:700;">${safeSubject}</h1>
        </div>
        <div style="position:relative; padding:32px;">${renderParagraphs(text)}</div>
      </div>
    </div>
  `.trim();

  return {
    html,
    attachments: [
      {
        filename: BRANDING_IMAGE_FILENAME,
        path: BRANDING_IMAGE_PATH,
        cid: BRANDING_IMAGE_CID,
        contentDisposition: "inline",
      },
    ],
  };
}
