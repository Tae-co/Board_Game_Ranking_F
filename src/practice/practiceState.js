// 연습 모드 상태. 화면 밖 모듈(axios 어댑터, storage, 웹소켓 훅)도 읽어야 해서 React 밖에 둔다.
// 메모리에만 있으므로 새로고침하면 연습이 끝나고 실제 데이터로 돌아온다.

// 띠의 n / 5. 단계 이름 → 몇 번째 칸인지
export const PRACTICE_STEPS = {
  createCommunity: 1,
  invite: 2,
  createRoom: 3,
  startGame: 4,
  score: 4,
  viewRanking: 5,
  viewMatches: 5,
  viewSeason: 5,
  lobby: 5,
  hallOfFame: 5,
  profile: 5,
  done: 5,
};

let state = { active: false, step: null };
const listeners = new Set();

export const getPracticeState = () => state;
export const isPracticeActive = () => state.active;

export const setPracticeState = (next) => {
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

export const subscribePractice = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
