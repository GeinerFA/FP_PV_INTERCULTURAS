import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.122"],
};

const withNextIntl = createNextIntlPlugin();

export default withFlowbiteReact(withNextIntl(nextConfig));
