import {
  applicationStatuses,
  applicationTypeCodes,
  type Application,
  type ApplicationStatus,
  type ApplicationTypeCode,
} from "@/types/application";

export type AdminApplicationListFilters = {
  status?: ApplicationStatus;
  applicationType?: ApplicationTypeCode;
  query?: string;
  from?: string;
  to?: string;
};

type SearchParamValue = string | string[] | undefined;

type SearchParamInput = {
  status?: SearchParamValue;
  type?: SearchParamValue;
  q?: SearchParamValue;
  from?: SearchParamValue;
  to?: SearchParamValue;
};

function getFirstSearchParamValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function buildDayStart(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

function buildNextDayStart(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000;
}

export function normalizeAdminApplicationListFilters(
  input: SearchParamInput | (AdminApplicationListFilters & { type?: SearchParamValue; q?: SearchParamValue }),
): AdminApplicationListFilters {
  const normalizedSource = input as Partial<
    SearchParamInput & { applicationType: SearchParamValue; query: SearchParamValue }
  >;
  const normalizedStatus = getFirstSearchParamValue(normalizedSource.status)?.trim();
  const rawType = normalizedSource.type ?? normalizedSource.applicationType;
  const rawQuery = normalizedSource.q ?? normalizedSource.query;
  const normalizedType = getFirstSearchParamValue(rawType)?.trim();
  const normalizedQuery = getFirstSearchParamValue(rawQuery)?.trim();
  const normalizedFrom = getFirstSearchParamValue(normalizedSource.from)?.trim();
  const normalizedTo = getFirstSearchParamValue(normalizedSource.to)?.trim();

  return {
    status: applicationStatuses.includes(normalizedStatus as ApplicationStatus)
      ? (normalizedStatus as ApplicationStatus)
      : undefined,
    applicationType: applicationTypeCodes.includes(normalizedType as ApplicationTypeCode)
      ? (normalizedType as ApplicationTypeCode)
      : undefined,
    query: normalizedQuery ? normalizedQuery.slice(0, 120) : undefined,
    from: normalizedFrom && isValidDateInput(normalizedFrom) ? normalizedFrom : undefined,
    to: normalizedTo && isValidDateInput(normalizedTo) ? normalizedTo : undefined,
  };
}

export function hasActiveAdminApplicationListFilters(filters: AdminApplicationListFilters): boolean {
  return Boolean(filters.status || filters.applicationType || filters.query || filters.from || filters.to);
}

export function countActiveAdminApplicationListFilters(filters: AdminApplicationListFilters): number {
  return [filters.status, filters.applicationType, filters.query, filters.from, filters.to].filter(Boolean).length;
}

export function buildAdminApplicationListQuery(filters: AdminApplicationListFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      status: filters.status,
      type: filters.applicationType,
      q: filters.query,
      from: filters.from,
      to: filters.to,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export function filterAdminApplications(
  applications: Application[],
  filters: AdminApplicationListFilters,
): Application[] {
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const fromBoundary = filters.from ? buildDayStart(filters.from) : null;
  const toBoundary = filters.to ? buildNextDayStart(filters.to) : null;

  return applications.filter((application) => {
    if (filters.status && application.status !== filters.status) {
      return false;
    }

    if (filters.applicationType && application.applicationType.code !== filters.applicationType) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = [application.fullName, application.firstName, application.lastName, application.email]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    if (fromBoundary !== null || toBoundary !== null) {
      const createdAt = new Date(application.createdAt).getTime();

      if (Number.isNaN(createdAt)) {
        return false;
      }

      if (fromBoundary !== null && createdAt < fromBoundary) {
        return false;
      }

      if (toBoundary !== null && createdAt >= toBoundary) {
        return false;
      }
    }

    return true;
  });
}
