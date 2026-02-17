export default function Card({
  children,
  title,
  subtitle,
  action,
  padding = true,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-surface-300 shadow-card
        ${className}
      `}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div>
            {title && <h3 className="text-display-sm text-ink-900">{title}</h3>}
            {subtitle && <p className="text-body-sm text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
}
