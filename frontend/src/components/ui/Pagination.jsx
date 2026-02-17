import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Build page numbers to show
  const pages = [];
  const delta = 1;
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
    pages.push(i);
  }
  if (pages[0] > 2) pages.unshift('...');
  if (pages[pages.length - 1] < totalPages - 1) pages.push('...');
  pages.unshift(1);
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <p className="text-body-sm text-ink-500">
        <span className="font-medium text-ink-700">{start}</span>–
        <span className="font-medium text-ink-700">{end}</span> sur{' '}
        <span className="font-medium text-ink-700">{total}</span>
      </p>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-default"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-ink-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`
                min-w-[2rem] h-8 px-2 text-body-sm font-medium rounded-lg transition-default
                ${page === p
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-ink-500 hover:bg-surface-100 hover:text-ink-700'
                }
              `}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-default"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
