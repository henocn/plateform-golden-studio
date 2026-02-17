export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-ink-400" />
        </div>
      )}
      <h3 className="text-display-sm text-ink-700 mb-1">{title}</h3>
      {description && (
        <p className="text-body-md text-ink-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
