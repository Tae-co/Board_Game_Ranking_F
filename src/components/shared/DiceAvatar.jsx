/**
 * 프로필 사진이 없는 사용자의 기본 아바타 — 동그라미 안에 넣는 주사위(5).
 * 이모지 🎲는 기기 폰트에 따라 ? 상자로 깨져서 SVG로 그린다.
 */
const DiceAvatar = ({ size, color = '#fff' }) => {
  const icon = Math.round(size * 0.56);
  return (
    <svg
      width={icon} height={icon} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={1.8}
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <g fill={color} stroke="none">
        <circle cx="8" cy="8" r="1.6" />
        <circle cx="16" cy="8" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="8" cy="16" r="1.6" />
        <circle cx="16" cy="16" r="1.6" />
      </g>
    </svg>
  );
};

export default DiceAvatar;
