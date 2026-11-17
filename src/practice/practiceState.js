// 연습 모드 상태. 화면 밖 모듈(axios 어댑터, storage, 웹소켓 훅)도 읽어야 해서 React 밖에 둔다.
// 메모리에만 있으므로 새로고침하면 연습이 끝나고 실제 데이터로 돌아온다.

// 띠의 n / 4. 단계 이름 → 몇 번째 칸인지
export const PRACTICE_STEPS = {
  createCommunity: 1,
  newRoom: 2,
  createRoom: 2,
  startGame: 3,
  score: 3,
  viewRanking: 4,
  viewMatches: 4,
  viewSeason: 4,
  lobby: 4,
  hallOfFame: 4,
  profile: 4,
  done: 4,
};

// 가짜 서버(practiceServer)가 쓰는 id. 화면은 예시 친구에 「예시」를 붙일 때 읽는다
// 실제 id와 겹치지 않게 큰 수를 쓴다. 900000001 % 8 = 1 → 예시 친구 아바타 색이 캔버스 순서(주황·초록·파랑·빨강)와 같다
export const PRACTICE_ID = 900000001;
// 예시 친구 4명 — 카탄(3~4명)에서 최소·최대 인원을 직접 겪게 모임을 5명으로 둔다
export const EXAMPLE_FRIEND_IDS = [0, 1, 2, 3].map(i => PRACTICE_ID + i);

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
