export const adminPageKeys = [
  "login",
  "dashboard",
  "programs",
  "programsNew",
  "programsEdit",
  "programsEnglish",
  "applications",
  "applicationDetail",
  "activity",
  "settings",
  "settingsHomeVideos",
  "settingsUsers",
  "settingsTranslations",
] as const;

export type AdminPageKey = (typeof adminPageKeys)[number];
