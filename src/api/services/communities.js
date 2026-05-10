import api from '../axios';

export const getMyCommunities = (userId) =>
  api.get(`/communities/my/list/${userId}`).then(r => r.data);
export const getJoinedCommunities = (userId) =>
  api.get(`/communities/joined/${userId}`).then(r => r.data);
export const getCommunity = (communityId) =>
  api.get(`/communities/${communityId}`).then(r => r.data);
export const getCommunityMembers = (communityId) =>
  api.get(`/communities/${communityId}/members`).then(r => r.data);

export const createCommunity = (payload) => api.post('/communities', payload).then(r => r.data);
export const updateCommunity = (communityId, payload) =>
  api.patch(`/communities/${communityId}`, payload).then(r => r.data);
export const deleteCommunity = (communityId) => api.delete(`/communities/${communityId}`);
export const joinCommunity = (inviteCode) =>
  api.post('/communities/join', { inviteCode });
export const kickCommunityMember = (communityId, memberId) =>
  api.delete(`/communities/${communityId}/members/${memberId}`);
