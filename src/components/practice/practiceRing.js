// 연습에서 지금 눌러야 할 곳을 두르는 테두리
// pulse: 눌러야 할 버튼만 바깥으로 빛이 퍼진다 (keyframes는 index.css). 목록·입력칸처럼 넓은 영역은 고정 테두리
export const practiceRing = (on, { pulse = false } = {}) => (on
  ? {
    boxShadow: '0 0 0 3px var(--th-primary), 0 0 0 8px rgba(var(--th-primary-rgb), 0.25)',
    ...(pulse && { animation: 'practice-pulse 1.6s ease-out infinite' }),
  }
  : {});
