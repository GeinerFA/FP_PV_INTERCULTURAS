import { Link } from "@/i18n/navigation";

type AdminPaginationProps = {
  pathname: "/admin/applications" | "/admin/programs" | "/admin/activity";
  currentPage: number;
  totalPages: number;
  query?: Record<string, string>;
  copy: {
    previousLabel: string;
    nextLabel: string;
    pageSummary: string;
    rangeSummary: string;
  };
};

type PaginationItem = number | "ellipsis";

function buildHref(pathname: AdminPaginationProps["pathname"], query: Record<string, string> | undefined) {
  if (!query || Object.keys(query).length === 0) {
    return pathname;
  }

  return { pathname, query };
}

function buildPageQuery(query: Record<string, string> | undefined, page: number) {
  if (page <= 1) {
    if (!query) {
      return undefined;
    }

    const restQuery = Object.fromEntries(Object.entries(query).filter(([key]) => key !== "page"));
    return Object.keys(restQuery).length > 0 ? restQuery : undefined;
  }

  return { ...(query ?? {}), page: String(page) };
}

function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export function AdminPagination({ pathname, currentPage, totalPages, query, copy }: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousQuery = buildPageQuery(query, currentPage - 1);
  const nextQuery = buildPageQuery(query, currentPage + 1);
  const pageItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div className="flex justify-center border-t border-emerald-900/8 px-6 py-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(pathname, previousQuery)}
            aria-label={copy.previousLabel}
            title={copy.previousLabel}
            className="admin-outline-action inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition"
          >
            <span aria-hidden="true">‹</span>
          </Link>
        ) : (
          <span
            aria-label={copy.previousLabel}
            title={copy.previousLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-400"
          >
            <span aria-hidden="true">‹</span>
          </span>
        )}

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm font-semibold text-slate-500"
            >
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="admin-primary-action inline-flex h-10 min-w-10 items-center justify-center rounded-full px-4 text-sm font-semibold shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(pathname, buildPageQuery(query, item))}
              aria-label={`${copy.pageSummary}: ${item}`}
              className="admin-outline-action inline-flex h-10 min-w-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition"
            >
              {item}
            </Link>
          ),
        )}

        {currentPage < totalPages ? (
          <Link
            href={buildHref(pathname, nextQuery)}
            aria-label={copy.nextLabel}
            title={copy.nextLabel}
            className="admin-outline-action inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition"
          >
            <span aria-hidden="true">›</span>
          </Link>
        ) : (
          <span
            aria-label={copy.nextLabel}
            title={copy.nextLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-400"
          >
            <span aria-hidden="true">›</span>
          </span>
        )}
      </div>
    </div>
  );
}
