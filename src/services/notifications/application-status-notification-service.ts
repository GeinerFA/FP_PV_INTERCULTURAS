import type { ApplicationStatus } from "@/types/application";

import { getEmailProvider, type EmailDeliveryResult } from "./email-provider";

type SendApplicationStatusNotificationInput = {
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  nextStatus: ApplicationStatus;
  subject: string;
  message: string;
};

export async function sendApplicationStatusNotification(
  input: SendApplicationStatusNotificationInput,
): Promise<EmailDeliveryResult> {
  const provider = getEmailProvider();

  return provider.send({
    to: input.applicantEmail,
    subject: input.subject,
    text: input.message,
    metadata: {
      applicationId: input.applicationId,
      applicantName: input.applicantName,
      notificationType: "application_status_update",
      nextStatus: input.nextStatus,
    },
  });
}
