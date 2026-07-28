export const ADMIN_LIST_PAGE_SIZE = 10;

type SearchParamValue = string | string[] | undefined;

export function normalizePageParam(value: SearchParamValue): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export type PaginationState = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function buildPaginationState(params: {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
}): PaginationState {
  const pageSize = Math.max(1, params.pageSize ?? ADMIN_LIST_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(params.totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, params.currentPage), totalPages);
  const startIndex = params.totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = params.totalItems === 0 ? 0 : Math.min(startIndex + pageSize, params.totalItems);

  return {
    currentPage,
    pageSize,
    totalItems: params.totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export function paginateItems<T>(items: T[], pagination: Pick<PaginationState, "startIndex" | "endIndex">): T[] {
  return items.slice(pagination.startIndex, pagination.endIndex);
}
