export function Coin({ width = 24, height = 24 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 21H14C17.3137 21 20 16.9706 20 12C20 7.02942 17.3137 3 14 3H10C6.68628 3 4 7.02942 4 12C4 16.9706 6.68628 21 10 21Z"
        stroke="#FF9924"
        stroke-width="2"
      />
      <ellipse cx="14" cy="12" rx="6" ry="9" fill="#FF9924" />
      <rect x="10" y="3" width="5" height="18" fill="#FF9924" />
      <ellipse cx="10" cy="12" rx="6" ry="9" fill="#FFD4A3" />
      <path
        d="M14 11.9886L11.6312 10.8193L12.6811 7.75055L10.3845 9.15799L9.5 6L8.61549 9.15799L6.3189 7.75055L7.36877 10.8193L5 11.9886L7.36745 13.1702L6.31496 16.2354L8.61286 14.8368L9.5 18L10.3858 14.8368L12.685 16.2354L11.6325 13.1702L14 11.9886Z"
        fill="#FF9924"
      />
    </svg>
  );
}
