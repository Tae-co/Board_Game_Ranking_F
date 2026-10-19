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
  // 🐐 The GOAT — 정면 염소 머리
  MOST_WINS: (
    <>
      <path d="M9.8 7.6C9.2 5 7.2 3.4 4.5 3.8" />
      <path d="M14.2 7.6c.6-2.6 2.6-4.2 5.3-3.8" />
      <path d="M8.7 10.2 4.5 11.2l4.4 1.6" />
      <path d="M15.3 10.2l4.2 1-4.4 1.6" />
      <path {...fill} d="M8.5 9a3.5 2 0 0 1 7 0l-1 7a2.5 2.5 0 0 1-5 0z" />
      <path d="M11 18.5 12 21l1-2.5" />
      <circle {...solid} cx="10.6" cy="12" r=".9" />
      <circle {...solid} cx="13.4" cy="12" r=".9" />
    </>
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
  // 🧠 Mastermind — 뇌
  BEST_WIN_RATE: (
    <>
      <path {...fill} d="M12 5.5A3 3 0 0 0 6.5 6a3 3 0 0 0-2 4.5 3 3 0 0 0 1 4.5 3 3 0 0 0 3 3.5A3 3 0 0 0 12 19.5z" />
      <path {...fill} d="M12 5.5A3 3 0 0 1 17.5 6a3 3 0 0 1 2 4.5 3 3 0 0 1-1 4.5 3 3 0 0 1-3 3.5 3 3 0 0 1-3.5 1z" />
      <path d="M12 5.5v14" />
      <path d="M8.5 9.5c1 0 1.5.8 1.5 1.5M15.5 9.5c-1 0-1.5.8-1.5 1.5M8 14.5c1 .2 1.8-.3 2-1M16 14.5c-1 .2-1.8-.3-2-1" />
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
  MOST_APP_OPENS: (
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
