import api from '../axios';
import { EVENTS, logEvent } from './events';

// 분자. source가 없으면 분모를 고를 수 없다 — 점수판 제출의 분모는 SCORE_SHEET_OPENED,
// 매치폼 제출의 분모는 MATCH_FORM_OPENED다. 둘을 섞으면 이탈률이 100%를 넘을 수 있다.
export const createMatch = (payload, source) => api.post('/matches', payload).then(r => {
  logEvent(EVENTS.MATCH_SUBMITTED, {
    roomId: payload?.roomId,
    boardGameId: payload?.boardGameId,
    props: { playerCount: payload?.participants?.length, source },
  });
  return r.data;
});
export const updateMatch = (matchId, payload) =>
  api.put(`/matches/${matchId}`, payload).then(r => r.data);
export const deleteMatch = (matchId) =>
  api.delete(`/matches/${matchId}`);
