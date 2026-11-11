import api from '../axios';
import { EVENTS, logEvent } from './events';

// communityId를 주면 공식 게임 + 그 커뮤니티의 커스텀 게임을 함께 받는다.
export const getGames = (communityId) =>
  api.get('/games', { params: communityId ? { communityId } : {} }).then(r => r.data);

export const getGame = (boardGameId) =>
  api.get(`/games/${boardGameId}`).then(r => r.data);

// 유저가 직접 만든 점수판 목록이 곧 "다음에 기본 제공할 게임" 후보다.
export const createGame = (payload) => api.post('/games', payload).then(r => {
  // 이 응답의 식별자 필드는 boardGameId가 아니라 id다 (rooms·communities와 다르다).
  // boardGameId로 읽으면 board_game_id가 NULL로 저장돼서 "어떤 게임을 직접 만드는가"를
  // 볼 수 없다 — 이 이벤트를 넣은 이유가 통째로 사라진다.
  logEvent(EVENTS.CUSTOM_GAME_CREATED, {
    boardGameId: r.data?.id,
    communityId: payload?.communityId,
  });
  return r.data;
});

// 커스텀 점수판 삭제. 방이나 플레이 기록이 있으면 백엔드가 409로 막는다.
export const deleteGame = (boardGameId) => api.delete(`/games/${boardGameId}`).then(r => r.data);

// 커스텀 게임 썸네일 업로드. 업로드한 URL을 createGame의 imageUrl로 넘긴다.
// Content-Type을 비워 브라우저가 multipart boundary를 넣게 한다 (axios 기본값 application/json 대신).
// 실패는 서버 메시지 없는 Error로 바꿔 던진다 — 화면은 서버 메시지가 없을 때 번역된 안내를 띄운다.
export const uploadGameImage = (file, communityId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('communityId', communityId);
  return api.post('/games/upload-image', formData, { headers: { 'Content-Type': undefined } })
    .then(r => r.data.url)
    .catch(() => { throw new Error('Image upload failed'); });
};
