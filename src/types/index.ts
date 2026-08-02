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
    | "/contact";
  labelKey: string;
};

export * from "./application";
export * from "./category";
export * from "./faq";
export * from "./program";
