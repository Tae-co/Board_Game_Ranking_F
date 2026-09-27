import api from '../axios';
import { EVENTS, logEvent } from './events';

// SCORE_SHEET_OPENED의 짝. 제출 경로가 점수판 하나뿐이라 둘의 비가 곧 게임별 이탈률이다.
// 제출 화면을 하나 더 만들면 그때는 분모를 고를 수 있도록 경로 구분을 props에 넣어야 한다.
export const createMatch = (payload) => api.post('/matches', payload).then(r => {
  logEvent(EVENTS.MATCH_SUBMITTED, {
    roomId: payload?.roomId,
    boardGameId: payload?.boardGameId,
    props: { playerCount: payload?.participants?.length },
  });
  return r.data;
});
export const updateMatch = (matchId, payload) =>
  api.put(`/matches/${matchId}`, payload).then(r => r.data);
export const deleteMatch = (matchId) =>
  api.delete(`/matches/${matchId}`);
