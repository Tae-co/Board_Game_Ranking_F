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
  // 🐐 The GOAT — 정면 염소 머리 (휜 뿔, 가로 귀, 수염)
  MOST_WINS: (
    <>
      <path {...solid} d="M9.6 7.6C8.7 4.6 6.6 2.8 3.8 3c2.1 1 3.3 2.9 3.7 5.1z" />
      <path {...solid} d="M14.4 7.6c.9-3 3-4.8 5.8-4.6-2.1 1-3.3 2.9-3.7 5.1z" />
      <path {...fill} d="M8.3 9.6C6.4 9.1 4.4 9.6 2.8 11.1c1.8.9 3.9.9 5.8 0z" />
      <path {...fill} d="M15.7 9.6c1.9-.5 3.9 0 5.5 1.5-1.8.9-3.9.9-5.8 0z" />
      <path {...fill} d="M7.8 8.6c0-1 1.9-1.6 4.2-1.6s4.2.6 4.2 1.6l-1.3 8.3c-.3 1.4-1.4 2.1-2.9 2.1s-2.6-.7-2.9-2.1z" />
      <path {...solid} d="M10.7 18.6 12 22.2l1.3-3.6z" />
      <circle {...solid} cx="10.2" cy="11.2" r="1" />
      <circle {...solid} cx="13.8" cy="11.2" r="1" />
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
  // 🧠 Mastermind — 옆모습 뇌 (전두·측두엽 경계, 주름)
  BEST_WIN_RATE: (
    <>
      <path {...fill} d="M3.5 12.3C3.5 7.9 7.2 4.5 12 4.5c4.9 0 8.5 3.2 8.5 7.3 0 2.2-1.2 3.9-3 4.7.1 1.6-1.1 2.8-2.7 2.8-1 0-1.9-.4-2.4-1.1-.8.4-1.8.6-2.8.6-3.6 0-6.1-2.6-6.1-6z" />
      <path d="M5.7 14c2-.4 4.2.1 5.8 1.6" />
      <path d="M12.2 4.8c-.6 2 .2 3.9 2 4.9" />
      <path d="M7.4 9.6c1.1-.9 2.6-.9 3.6 0" />
      <path d="M15.3 12.3c1.1.3 2.2 0 3-.9" />
      <path d="M13.2 13.6c-.3 1.1-.1 2.1.7 2.9" />
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
