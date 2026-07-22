export const adminPageKeys = [
  "login",
  "dashboard",
  "programs",
  "programsNew",
  "programsEdit",
  "applications",
  "applicationDetail",
  "activity",
  "settings",
] as const;

export type AdminPageKey = (typeof adminPageKeys)[number];
