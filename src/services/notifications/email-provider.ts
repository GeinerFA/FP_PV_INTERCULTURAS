import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid?: string;
    contentDisposition?: "inline" | "attachment";
  }>;
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

type EmailProviderEnvironment = Record<string, string | undefined>;

type EmailTransport = {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: EmailMessage["attachments"];
  }): Promise<{ messageId?: string }>;
};

type EmailTransportFactory = (options: {
  service: "gmail";
  auth: {
    user: string;
    pass: string;
  };
}) => EmailTransport;

type ResolvedEmailProviderConfiguration =
  | {
      type: "noop";
    }
  | {
      type: "unsupported";
      provider: string;
    }
  | {
      type: "misconfigured";
      provider: "gmail";
      reason: string;
    }
  | {
      type: "gmail";
      provider: "gmail";
      user: string;
      pass: string;
      from: string;
    };

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

function readEnvValue(env: EmailProviderEnvironment, key: keyof EmailProviderEnvironment): string {
  return env[key]?.trim() ?? "";
}

export function resolveEmailProviderConfiguration(
  env: EmailProviderEnvironment = process.env,
): ResolvedEmailProviderConfiguration {
  const provider = readEnvValue(env, "EMAIL_PROVIDER").toLowerCase();

  if (!provider || provider === "noop") {
    return { type: "noop" };
  }

  if (provider !== "gmail") {
    return {
      type: "unsupported",
      provider,
    };
  }

  const user = readEnvValue(env, "EMAIL_GMAIL_USER");
  const pass = readEnvValue(env, "EMAIL_GMAIL_APP_PASSWORD");
  const from = readEnvValue(env, "EMAIL_FROM") || user;

  if (!user || !pass || !from) {
    return {
      type: "misconfigured",
      provider: "gmail",
      reason:
        "Gmail email delivery requires EMAIL_GMAIL_USER, EMAIL_GMAIL_APP_PASSWORD, and EMAIL_FROM (or a fallback sender from EMAIL_GMAIL_USER).",
    };
  }

  return {
    type: "gmail",
    provider: "gmail",
    user,
    pass,
    from,
  };
}

function buildUnsupportedProvider(provider: string): EmailProvider {
  return {
    async send() {
      return {
        status: "not_configured",
        provider,
        code: "provider_not_implemented",
        reason: `The email provider "${provider}" is not implemented yet.`,
      };
    },
  };
}

function buildMisconfiguredProvider(provider: string, reason: string): EmailProvider {
  return {
    async send() {
      return {
        status: "not_configured",
        provider,
        code: "provider_not_configured",
        reason,
      };
    },
  };
}

function getEmailFailureReason(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown email provider error.";
}

export function createEmailProvider({
  env = process.env,
  createTransport = nodemailer.createTransport,
}: {
  env?: EmailProviderEnvironment;
  createTransport?: EmailTransportFactory;
} = {}): EmailProvider {
  const configuration = resolveEmailProviderConfiguration(env);

  if (configuration.type === "noop") {
    return noopEmailProvider;
  }

  if (configuration.type === "unsupported") {
    return buildUnsupportedProvider(configuration.provider);
  }

  if (configuration.type === "misconfigured") {
    return buildMisconfiguredProvider(configuration.provider, configuration.reason);
  }

  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: configuration.user,
      pass: configuration.pass,
    },
  });

  return {
    async send(message) {
      try {
        const result = await transporter.sendMail({
          from: configuration.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments: message.attachments,
        });

        return {
          status: "sent",
          provider: configuration.provider,
          code: "sent",
          messageId: result.messageId,
        };
      } catch (error) {
        return {
          status: "failed",
          provider: configuration.provider,
          code: "delivery_failed",
          reason: getEmailFailureReason(error),
        };
      }
    },
  };
}

export function getEmailProvider(): EmailProvider {
  return createEmailProvider();
}
