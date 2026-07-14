import api from '../axios';

// communityId를 주면 공식 게임 + 그 커뮤니티의 커스텀 게임을 함께 받는다.
export const getGames = (communityId) =>
  api.get('/games', { params: communityId ? { communityId } : {} }).then(r => r.data);

export const getGame = (boardGameId) =>
  api.get(`/games/${boardGameId}`).then(r => r.data);

export const createGame = (payload) => api.post('/games', payload).then(r => r.data);
