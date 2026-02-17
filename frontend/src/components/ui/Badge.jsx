const colorMap = {
  primary: 'bg-primary-50  text-primary-600 border-primary-200',
  success: 'bg-success-50  text-success-700 border-success-200',
  warning: 'bg-warning-50  text-warning-700 border-warning-200',
  danger:  'bg-danger-50   text-danger-700  border-danger-200',
  info:    'bg-info-50     text-info-600    border-info-200',
  neutral: 'bg-surface-200 text-ink-500     border-surface-300',
};

const sizeMap = {
  xs: 'text-[0.625rem] px-1.5 py-0.5',
  sm: 'text-body-sm px-2 py-0.5',
  md: 'text-body-sm px-2.5 py-0.5',
};

export default function Badge({
  children,
  color = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${colorMap[color] || colorMap.neutral}
        ${sizeMap[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-70`} />
      )}
      {children}
    </span>
  );
}
