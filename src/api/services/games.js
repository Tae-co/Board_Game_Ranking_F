import api, { getAccessToken } from '../axios';
import { EVENTS, logEvent } from './events';

// communityId를 주면 공식 게임 + 그 커뮤니티의 커스텀 게임을 함께 받는다.
export const getGames = (communityId) =>
  api.get('/games', { params: communityId ? { communityId } : {} }).then(r => r.data);

export const getGame = (boardGameId) =>
  api.get(`/games/${boardGameId}`).then(r => r.data);

// 유저가 직접 만든 점수판 목록이 곧 "다음에 기본 제공할 게임" 후보다.
export const createGame = (payload) => api.post('/games', payload).then(r => {
  logEvent(EVENTS.CUSTOM_GAME_CREATED, {
    boardGameId: r.data?.boardGameId,
    communityId: payload?.communityId,
  });
  return r.data;
});

// 커스텀 점수판 삭제. 방이나 플레이 기록이 있으면 백엔드가 409로 막는다.
export const deleteGame = (boardGameId) => api.delete(`/games/${boardGameId}`).then(r => r.data);

// 커스텀 게임 썸네일 업로드. 업로드한 URL을 createGame의 imageUrl로 넘긴다.
// axios 인스턴스는 Content-Type을 application/json으로 고정해서 FormData를 JSON으로 바꿔버린다.
// 그래서 여기만 fetch를 쓴다 (어드민 이미지 업로드도 같은 이유로 fetch를 쓴다).
export const uploadGameImage = async (file, communityId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('communityId', communityId);

  const token = getAccessToken();
  const res = await fetch(`${import.meta.env.VITE_API_URL}/games/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');

  const data = await res.json();
  return data.url;
};
