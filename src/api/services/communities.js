import api from '../axios';
import { EVENTS, logEvent } from './events';

export const getMyCommunities = (userId) =>
  api.get(`/communities/my/list/${userId}`).then(r => r.data);
export const getJoinedCommunities = (userId) =>
  api.get(`/communities/joined/${userId}`).then(r => r.data);
export const getCommunity = (communityId) =>
  api.get(`/communities/${communityId}`).then(r => r.data);
export const getCommunityMembers = (communityId) =>
  api.get(`/communities/${communityId}/members`).then(r => r.data);

export const createCommunity = (payload) => api.post('/communities', payload).then(r => {
  logEvent(EVENTS.COMMUNITY_CREATE_COMPLETED, { communityId: r.data?.communityId });
  return r.data;
});
export const updateCommunity = (communityId, payload) =>
  api.patch(`/communities/${communityId}`, payload).then(r => r.data);
export const deleteCommunity = (communityId) => api.delete(`/communities/${communityId}`);
export const joinCommunity = (inviteCode) =>
  api.post('/communities/join', { inviteCode }).then(r => {
    // 이미 멤버여도 200이다 — 원래 있던 모임에 들어간 건 참가가 아니다 (서버도 중복을 한 번 더 거른다)
    if (!r.data?.alreadyMember) logEvent(EVENTS.COMMUNITY_JOIN_COMPLETED, { communityId: r.data?.communityId });
    return r;
  });
export const kickCommunityMember = (communityId, memberId) =>
  api.delete(`/communities/${communityId}/members/${memberId}`);
