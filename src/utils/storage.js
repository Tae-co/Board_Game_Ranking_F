// App-level localStorage helpers (auth keys are in auth/storage.js)

const SELECTED_COMMUNITY_KEY = 'selectedCommunity';
const MY_COMMUNITY_KEY = 'myCommunity';
const PROFILE_IMAGE_KEY = 'profileImage';

export const getSelectedCommunity = () => {
  try { return JSON.parse(localStorage.getItem(SELECTED_COMMUNITY_KEY)); } catch { return null; }
};

export const setSelectedCommunity = (community) => {
  if (community == null) {
    localStorage.removeItem(SELECTED_COMMUNITY_KEY);
  } else {
    localStorage.setItem(SELECTED_COMMUNITY_KEY, JSON.stringify(community));
  }
};

export const removeSelectedCommunity = () => {
  localStorage.removeItem(SELECTED_COMMUNITY_KEY);
};

export const getMyCommunity = () => {
  try { return JSON.parse(localStorage.getItem(MY_COMMUNITY_KEY)); } catch { return null; }
};

export const setMyCommunity = (community) => {
  if (community == null) {
    localStorage.removeItem(MY_COMMUNITY_KEY);
  } else {
    localStorage.setItem(MY_COMMUNITY_KEY, JSON.stringify(community));
  }
};

export const removeMyCommunity = () => {
  localStorage.removeItem(MY_COMMUNITY_KEY);
};

export const getProfileImage = () => localStorage.getItem(PROFILE_IMAGE_KEY);

export const setProfileImage = (url) => {
  if (url == null) {
    localStorage.removeItem(PROFILE_IMAGE_KEY);
  } else {
    localStorage.setItem(PROFILE_IMAGE_KEY, url);
  }
};

export const removeProfileImage = () => {
  localStorage.removeItem(PROFILE_IMAGE_KEY);
};

const COMMUNITY_VISIT_KEY = 'communityVisitOrder';

export const getCommunityVisitOrder = () => {
  try { return JSON.parse(localStorage.getItem(COMMUNITY_VISIT_KEY)) || {}; } catch { return {}; }
};

export const recordCommunityVisit = (communityId) => {
  const order = getCommunityVisitOrder();
  order[communityId] = Date.now();
  localStorage.setItem(COMMUNITY_VISIT_KEY, JSON.stringify(order));
};

export const sortByRecentVisit = (communities) => {
  const order = getCommunityVisitOrder();
  return [...communities].sort((a, b) => {
    const ta = order[a.communityId] ?? 0;
    const tb = order[b.communityId] ?? 0;
    return tb - ta;
  });
};

export const SELECTED_COMMUNITY_UPDATED_EVENT = 'selectedCommunityUpdated';

export const notifySelectedCommunityUpdated = () => {
  window.dispatchEvent(new Event(SELECTED_COMMUNITY_UPDATED_EVENT));
};

/**
 * 모임장 Pro 구독 (UI 프로토타입 — 실제 결제 없음).
 *
 * 과금 단위가 커뮤니티당이라 커뮤니티별로 저장한다 (문서: "과금 단위 = 커뮤니티(그룹)당").
 * 형태: { [communityId]: { billing, startedAt, canceledAt } }
 * canceledAt이 있으면 해지 예약 상태 — 남은 기간까지는 계속 이용한다.
 */
const SUBSCRIPTION_KEY = 'proSubscriptions';

const readSubscriptions = () => {
  try { return JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY)) || {}; } catch { return {}; }
};

export const getSubscription = (communityId) => {
  if (communityId == null) return null;
  return readSubscriptions()[communityId] ?? null;
};

export const setSubscription = (communityId, subscription) => {
  if (communityId == null) return;
  const all = readSubscriptions();
  if (subscription == null) delete all[communityId];
  else all[communityId] = subscription;
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(all));
};
