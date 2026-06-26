export type AdminRouteItem = {
  href: string;
  label: string;
};

export type PublicRouteItem = {
  href:
    | "/"
    | "/about"
    | "/faqs"
    | "/programs"
    | "/apply"
    | "/impact"
    | "/contact"
    | "/privacy";
  labelKey: string;
};

export * from "./application";
export * from "./program";
