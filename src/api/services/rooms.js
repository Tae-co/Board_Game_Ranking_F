import api from '../axios';

export const getRoom = (roomId) => api.get(`/rooms/${roomId}`).then(r => r.data);
export const getRoomMembers = (roomId) => api.get(`/rooms/${roomId}/members`).then(r => r.data || []);
export const getMyRooms = (userId) => api.get(`/rooms/my/${userId}`).then(r => r.data);
export const getCommunityRooms = (communityId, userId) =>
  api.get(`/communities/${communityId}/rooms?memberId=${userId}`).then(r => r.data);

export const createRoom = (payload) => api.post('/rooms', payload).then(r => r.data);
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
export const getRoomMatches = (roomId) =>
  api.get(`/rooms/${roomId}/matches`).then(r => r.data || []);
export const updateMemberRating = (roomId, memberId, payload) =>
  api.put(`/rooms/${roomId}/members/${memberId}/rating`, payload);
