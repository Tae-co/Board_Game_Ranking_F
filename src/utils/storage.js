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

const ANON_ID_KEY = 'anonId';

// 로그인 전(초대 링크 랜딩)과 로그인 후를 잇는 기기 단위 ID.
// randomUUID는 보안 컨텍스트에서만 있으므로(LAN 라이브리로드 등) 폴백을 둔다.
export const getAnonId = () => {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto?.randomUUID?.() ?? `a-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};
