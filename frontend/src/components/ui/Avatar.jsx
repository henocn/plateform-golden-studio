import { getInitials } from '../../utils/helpers';

const sizeMap = {
  xs: 'w-6 h-6 text-[0.625rem]',
  sm: 'w-8 h-8 text-body-sm',
  md: 'w-10 h-10 text-body-md',
  lg: 'w-12 h-12 text-body-lg',
};

export default function Avatar({
  src,
  firstName,
  lastName,
  size = 'md',
  className = '',
}) {
  const initials = getInitials(firstName, lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeMap[size]} rounded-full
        bg-primary-100 text-primary-600 font-semibold
        flex items-center justify-center
        ring-2 ring-white
        ${className}
      `}
    >
      {initials}
    </div>
  );
}
