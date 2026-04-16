export type AdminRouteItem = {
  href: string;
  label: string;
};

export type PublicRouteItem = {
  href: "/" | "/about" | "/programs" | "/apply" | "/impact" | "/contact" | "/privacy";
  labelKey: string;
};

export * from "./program";
