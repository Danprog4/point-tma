export const ReviewStar = ({
  onClick,
  isActive,
  fillPercentage = 100,
  width = 40,
  height = 40,
  disabled = false,
  isLast = false,
}: {
  onClick: () => void;
  isActive: boolean;
  fillPercentage?: number; // 0-100, процент заливки звезды
  width?: number;
  height?: number;
  disabled?: boolean;
  isLast?: boolean;
}) => {
  const starId = `star-${Math.random().toString(36).substr(2, 9)}`;

  const getFillColor = () => {
    if (isLast && fillPercentage > 0) {
      return `url(#${starId})`;
    }
    if (isActive) {
      return "#FFD943";
    }
    return "#FFFFFF";
  };

  return (
    <svg
      onClick={disabled ? undefined : onClick}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset={`${fillPercentage}%`} stopColor="#FFD943" />
          <stop offset={`${fillPercentage}%`} stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        d="M17.8095 5.07082C18.7523 3.30973 21.2476 3.30973 22.1903 5.07082L26.2573 12.6679L34.6338 14.266C36.5678 14.6349 37.336 17.0226 35.9881 18.475L30.1245 24.7933L31.2206 33.987C31.4732 35.3818 29.4573 36.8608 27.6758 35.9993L19.9999 32.2873L12.324 35.9993C10.5426 36.8608 8.52667 35.3818 8.77925 33.3987L9.87534 24.7933L4.01174 18.475C2.66383 17.0225 3.43208 14.6349 5.36605 14.266L13.7426 12.6679L17.8095 5.07082Z"
        fill={getFillColor()}
        stroke="#FFD943"
        strokeWidth="1"
      />
    </svg>
  );
};
