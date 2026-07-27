export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  metadata?: Record<string, string>;
};

export type EmailDeliveryResult =
  | {
      status: "sent";
      provider: string;
      code: "sent";
      messageId?: string;
    }
  | {
      status: "not_configured" | "failed";
      provider: string;
      code: string;
      reason: string;
    };

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}

const noopEmailProvider: EmailProvider = {
  async send() {
    return {
      status: "not_configured",
      provider: "noop",
      code: "provider_not_configured",
      reason: "No email provider has been configured yet.",
    };
  },
};

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "noop") {
    return noopEmailProvider;
  }

  return {
    async send() {
      return {
        status: "not_configured",
        provider,
        code: "provider_not_implemented",
        reason: `The email provider \"${provider}\" is not implemented yet.`,
      };
    },
  };
}
