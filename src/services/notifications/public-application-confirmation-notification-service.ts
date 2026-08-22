import type { AppLocale } from "@/config/i18n";

import { renderBrandedEmailTemplate } from "./branded-email.ts";
import { getEmailProvider, type EmailDeliveryResult } from "./email-provider.ts";

type SendPublicApplicationConfirmationInput = {
  locale: AppLocale;
  applicantEmail: string;
  applicantName: string;
};

export function buildPublicApplicationConfirmationEmailCopy(locale: AppLocale, applicantName: string) {
  if (locale === "es") {
    return {
      subject: "Recibimos tu solicitud",
      text: [
        `Hola ${applicantName || ""},`.trim(),
        "",
        "Te confirmamos que recibimos tu solicitud correctamente.",
        "",
        "Nuestro equipo de Pura Vida Interculturas la va a revisar y, si necesitamos información adicional, te vamos a contactar por este mismo correo.",
        "",
        "Gracias por postularte.",
        "Pura Vida Interculturas",
      ].join("\n"),
    };
  }

  return {
    subject: "We received your application",
    text: [
      `Hello ${applicantName || ""},`.trim(),
      "",
      "We are confirming that we received your application successfully.",
      "",
      "Our Pura Vida Interculturas team will review it and, if we need any additional information, we will contact you through this email address.",
      "",
      "Thank you for applying.",
      "Pura Vida Interculturas",
    ].join("\n"),
  };
}

export async function sendPublicApplicationConfirmation(
  input: SendPublicApplicationConfirmationInput,
): Promise<EmailDeliveryResult> {
  const provider = getEmailProvider();
  const copy = buildPublicApplicationConfirmationEmailCopy(input.locale, input.applicantName);
  const renderedTemplate = renderBrandedEmailTemplate(copy);

  return provider.send({
    to: input.applicantEmail,
    subject: copy.subject,
    text: copy.text,
    html: renderedTemplate.html,
    attachments: renderedTemplate.attachments,
    metadata: {
      applicantName: input.applicantName,
      locale: input.locale,
      notificationType: "public_application_confirmation",
    },
  });
}
