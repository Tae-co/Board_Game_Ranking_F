import api from '../axios';
import { EVENTS, logEvent } from './events';

// SCORE_SHEET_OPENED의 짝. 둘의 비가 게임별 점수판 이탈률이 된다.
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
