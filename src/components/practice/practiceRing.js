// 연습에서 지금 눌러야 할 곳을 두르는 테두리
export const practiceRing = (on) => (on
  ? { boxShadow: '0 0 0 3px var(--th-primary), 0 0 0 8px rgba(var(--th-primary-rgb), 0.25)' }
  : {});
