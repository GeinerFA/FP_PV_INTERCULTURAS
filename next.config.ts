import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.122"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow multipart overhead while keeping the app-level image payload capped at 2 MB.
      bodySizeLimit: "3mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin();

export default withFlowbiteReact(withNextIntl(nextConfig));
