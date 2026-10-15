import api from '../axios';
import { EVENTS, logEvent } from './events';

export const getRoom = (roomId) => api.get(`/rooms/${roomId}`).then(r => r.data);
export const getRoomMembers = (roomId) => api.get(`/rooms/${roomId}/members`).then(r => r.data || []);
export const getRoomByInviteCode = (inviteCode) =>
  api.get(`/rooms/code/${encodeURIComponent(inviteCode)}`).then(r => r.data);
export const getMyRooms = (userId) => api.get(`/rooms/my/${userId}`).then(r => r.data);
export const getCommunityRooms = (communityId, userId) =>
  api.get(`/communities/${communityId}/rooms?memberId=${userId}`).then(r => r.data);

export const createRoom = (payload) => api.post('/rooms', payload).then(r => {
  logEvent(EVENTS.ROOM_CREATE_COMPLETED, {
    roomId: r.data?.roomId,
    boardGameId: r.data?.boardGameId,
    communityId: payload?.communityId,
  });
  return r.data;
});
export const joinRoom = (inviteCode) =>
  api.post('/rooms/join', { inviteCode });
export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`);

export const kickRoomMember = (roomId, memberId) =>
  api.delete(`/rooms/${roomId}/members/${memberId}`);
export const leaveRoom = (roomId, userId) =>
  api.delete(`/rooms/${roomId}/members/${userId}`);
export const updateRoomName = (roomId, roomName) =>
  api.patch(`/rooms/${roomId}/name`, { roomName });

export const getRoomRankings = (roomId) =>
  api.get(`/rooms/${roomId}/rankings`).then(r => r.data || []);

// 마감된 시즌의 순위표. 응답 스키마가 현재 랭킹과 같아서 같은 테이블로 그린다.
export const getRoomSeasonRankings = (roomId, seasonId) =>
  api.get(`/rooms/${roomId}/rankings?seasonId=${seasonId}`).then(r => r.data || []);
export const getRoomSeasons = (roomId) =>
  api.get(`/rooms/${roomId}/seasons`).then(r => r.data || []);
export const getSeasonPodium = (roomId, seasonId) =>
  api.get(`/rooms/${roomId}/seasons/${seasonId}/podium`).then(r => r.data || []);

// 진행 중 시즌. 종료 시각이 지났으면 서버가 넘긴 뒤의 시즌을 준다.
export const getCurrentSeason = (roomId) =>
  api.get(`/rooms/${roomId}/seasons/current`).then(r => r.data);
// 호스트 전용 — { name, endDate: 'YYYY-MM-DD' } (endDate는 내일 이후)
export const updateCurrentSeason = (roomId, payload) =>
  api.put(`/rooms/${roomId}/seasons/current`, payload).then(r => r.data);
export const getRoomMatches = (roomId) =>
  api.get(`/rooms/${roomId}/matches`).then(r => r.data || []);
export const updateMemberRating = (roomId, memberId, payload) =>
  api.put(`/rooms/${roomId}/members/${memberId}/rating`, payload);
