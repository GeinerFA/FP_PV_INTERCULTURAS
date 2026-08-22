import type { ApplicationStatus } from "@/types/application";

import { renderBrandedEmailTemplate } from "./branded-email.ts";
import { getEmailProvider, type EmailDeliveryResult } from "./email-provider.ts";

type SendApplicationStatusNotificationInput = {
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  previousStatus: ApplicationStatus;
  nextStatus: ApplicationStatus;
  subject: string;
  message: string;
};

export function shouldSendApplicationStatusNotification(
  previousStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
): boolean {
  return previousStatus === "pending" && nextStatus === "in_process";
}

export async function sendApplicationStatusNotification(
  input: SendApplicationStatusNotificationInput,
): Promise<EmailDeliveryResult> {
  const provider = getEmailProvider();
  const renderedTemplate = renderBrandedEmailTemplate({
    subject: input.subject,
    text: input.message,
  });

  return provider.send({
    to: input.applicantEmail,
    subject: input.subject,
    text: input.message,
    html: renderedTemplate.html,
    attachments: renderedTemplate.attachments,
    metadata: {
      applicationId: input.applicationId,
      applicantName: input.applicantName,
      notificationType: "application_status_update",
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
    },
  });
}
