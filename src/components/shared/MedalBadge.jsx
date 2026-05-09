const MedalBadge = ({ place, size = 22 }) => {
  const cfg = {
    1: { outer: '#FFD700', inner: '#FFA500', ribbon: '#E69500' },
    2: { outer: '#C8C8D4', inner: '#A0A0B0', ribbon: '#8888A0' },
    3: { outer: '#D4936A', inner: '#B07040', ribbon: '#8A5530' },
  }[place] || {};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="8" fill={cfg.outer} />
      <circle cx="12" cy="13" r="6" fill={cfg.inner} />
      <path d="M12 8l1.18 2.39 2.64.38-1.91 1.86.45 2.63L12 14.01l-2.36 1.25.45-2.63-1.91-1.86 2.64-.38z" fill="#fff" />
      <path d="M9 4h6l-1 4H10z" fill={cfg.ribbon} />
      <path d="M9 4l-2 4h3l1-4z" fill={cfg.outer} />
      <path d="M15 4l2 4h-3l-1-4z" fill={cfg.outer} />
    </svg>
  );
};

export default MedalBadge;
