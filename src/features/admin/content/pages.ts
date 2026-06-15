export const adminPageKeys = [
  "login",
  "dashboard",
  "programs",
  "programsNew",
  "programsEdit",
  "applications",
  "applicationDetail",
  "reports",
  "activity",
  "settings",
] as const;

export type AdminPageKey = (typeof adminPageKeys)[number];
