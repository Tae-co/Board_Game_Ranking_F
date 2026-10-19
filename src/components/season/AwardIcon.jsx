/**
 * 모임 현황 기록 아이콘. 24×24 선 아이콘에 같은 색 옅은 면을 깐다.
 * 공유 이미지(html2canvas)에서 currentColor가 풀리지 않을 수 있어 색은 값으로 받는다.
 */
const shapes = (fill, solid) => ({
  // 👑 Latest Champ — 왕관
  LAST_WINNER: (
    <>
      <path {...fill} d="M3.5 8.5 7.5 12 12 5l4.5 7 4-3.5L18.5 18h-13z" />
      <path d="M5.5 21h13" />
      <circle {...solid} cx="3.5" cy="7.5" r="1.4" />
      <circle {...solid} cx="12" cy="4" r="1.4" />
      <circle {...solid} cx="20.5" cy="7.5" r="1.4" />
    </>
  ),
  // 🐐 The GOAT — 왼쪽을 보는 아이벡스 옆모습 (뒤로 휜 뿔, 수염). 오른쪽 보기로 그리고 좌우 반전한다
  MOST_WINS: (
    <g transform="matrix(-1 0 0 1 24 0)">
      <path {...fill} d="M4.5 12.2c0-1.2 1-2 2.3-2.1l6.7-.4 2.6-3.9c.5-.7 1.4-.8 2-.2l2.6 2.4c.4.4.1 1-.4 1h-2l-1.3 2.3c-.4.8-.6 1.7-.7 2.6-2.8 1.1-6.4 1.2-9.3.5-1.4-.4-2.5-1.1-2.5-2.2z" />
      <path d="M6.6 14.4l-.7 3.2-.4 4M9 14.8l.2 3-.6 3.7M14.4 14.8l.4 3.4-.2 3.4M16 14.2l.6 3.4.1 3.8" />
      <path d="M16.4 6.4C16.4 2.9 13.2 1.2 10.6 2.8c-1.6 1-1.8 3.2-.6 4.5" />
      <path d="M20 10.2l-.5 2.2" />
      <circle {...solid} cx="18" cy="7.6" r=".7" />
    </g>
  ),
  // 🔥 Unstoppable — 불꽃
  LONGEST_STREAK: (
    <>
      <path {...fill} d="M12 2.5c1 3.5 6 5.5 6 11a6 6 0 0 1-12 0c0-3 1.5-4.5 2.8-5.6.2 1.7 1 2.8 2.2 3.4-.3-3.3-.2-6.1 1-8.8z" />
      <path d="M12 14.5c1.2 1 2.2 2 2.2 3.3a2.2 2.2 0 0 1-4.4 0c0-1.2.9-2.2 2.2-3.3z" />
    </>
  ),
  // 💀 Cursed — 해골
  LONGEST_LOSING_STREAK: (
    <>
      <path {...fill} d="M12 3a8 8 0 0 0-8 8c0 2.6 1.2 4.4 3 5.5V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.5c1.8-1.1 3-2.9 3-5.5a8 8 0 0 0-8-8z" />
      <circle {...solid} cx="9" cy="11.5" r="1.7" />
      <circle {...solid} cx="15" cy="11.5" r="1.7" />
      <path d="M12 14.5 11 16.5h2z" />
      <path d="M10.5 20v-2M13.5 20v-2" />
    </>
  ),
  // 🧠 Mastermind — 옆얼굴 안의 뇌
  BEST_WIN_RATE: (
    <>
      <path d="M8.5 22v-3.2H6.4c-.8 0-1.4-.6-1.4-1.4v-2.2H3.2l1.7-3.4C4.9 6.6 8.3 2.8 12.8 2.8c4.5 0 7.9 3.6 7.9 8.1 0 2.7-1.2 4.8-3 6.2V22" />
      <path {...fill} d="M10.6 14.2a2.4 2.4 0 0 1-2-3.6 2.6 2.6 0 0 1 2-4A2.9 2.9 0 0 1 15.4 5a2.6 2.6 0 0 1 3.6 2.6 2.4 2.4 0 0 1 .4 3.9 2.4 2.4 0 0 1-2.3 2.7z" />
      <path d="M13.8 14.2V17" />
      <path d="M11.6 9.2c1 0 1.8.8 1.8 1.8M16.6 8.4c-.8.4-1.1 1.3-.8 2.1M14.4 6.8c-.2.9.2 1.7 1 2.1" />
    </>
  ),
  // 🎲 Addict — 주사위 두 개
  MOST_PLAYED: (
    <>
      <path d="M10 7V5.5A2.5 2.5 0 0 1 12.5 3h6A2.5 2.5 0 0 1 21 5.5v6a2.5 2.5 0 0 1-2.5 2.5H15" />
      <circle {...solid} cx="18" cy="6" r=".9" />
      <rect {...fill} x="3" y="7" width="12" height="12" rx="2.5" />
      <circle {...solid} cx="6.5" cy="10.5" r=".9" />
      <circle {...solid} cx="9" cy="13" r=".9" />
      <circle {...solid} cx="11.5" cy="15.5" r=".9" />
    </>
  ),
  // 📝 The Scorekeeper — 메모지와 연필
  MOST_RECORDED: (
    <>
      <path {...fill} d="M16 11V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5" />
      <path d="M7 8h6M7 11.5h5M7 15h2.5" />
      <path d="m19.5 9.5 1.5 1.5-7 7-2.5.5.5-2.5z" />
    </>
  ),
});

const AwardIcon = ({ type, color, size = 24 }) => {
  const shape = shapes({ fill: color, fillOpacity: 0.16 }, { fill: color, stroke: 'none' })[type];
  if (!shape) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      {shape}
    </svg>
  );
};

export default AwardIcon;
