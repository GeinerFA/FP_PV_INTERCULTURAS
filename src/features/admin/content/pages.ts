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
  "settingsUsers",
] as const;

export type AdminPageKey = (typeof adminPageKeys)[number];
