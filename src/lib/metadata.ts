import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type MetadataInput = {
  title: string;
  description: string;
};

export function buildMetadata({ title, description }: MetadataInput): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      type: "website",
    },
  };
}
