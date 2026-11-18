// App-level localStorage helpers (auth keys are in auth/storage.js)
import { isPracticeActive } from '../practice/practiceState';

// 연습 중에는 커뮤니티 관련 값을 메모리에만 둔다 — 연습이 끝나거나 새로고침하면 실제 값이 그대로 남아 있다
const practiceMemory = new Map();
const readItem = (key) => (isPracticeActive() ? practiceMemory.get(key) ?? null : localStorage.getItem(key));
const writeItem = (key, value) => {
  if (isPracticeActive()) practiceMemory.set(key, value);
  else localStorage.setItem(key, value);
};
const deleteItem = (key) => {
  if (isPracticeActive()) practiceMemory.delete(key);
  else localStorage.removeItem(key);
};
export const clearPracticeMemory = () => practiceMemory.clear();

const SELECTED_COMMUNITY_KEY = 'selectedCommunity';
const MY_COMMUNITY_KEY = 'myCommunity';
const PROFILE_IMAGE_KEY = 'profileImage';

export const getSelectedCommunity = () => {
  try { return JSON.parse(readItem(SELECTED_COMMUNITY_KEY)); } catch { return null; }
};

export const setSelectedCommunity = (community) => {
  if (community == null) {
    deleteItem(SELECTED_COMMUNITY_KEY);
  } else {
    writeItem(SELECTED_COMMUNITY_KEY, JSON.stringify(community));
  }
};

// 고른 적 없으면 기기 언어 — 한국어 기기에서 첫 화면이 영어로 떠서 영어 앱인 줄 알았다
export const getLanguage = () => {
  try {
    return localStorage.getItem('language')
      || (navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en');
  } catch { return 'ko'; }
};

export const saveLanguage = (lang) => {
  localStorage.setItem('language', lang);
};

export const getStoredTheme = () => localStorage.getItem('theme') || 'default';

export const saveTheme = (key) => {
  localStorage.setItem('theme', key);
};

// 로그인 후 돌아갈 경로. 웹 OAuth는 같은 탭으로 돌아오므로 sessionStorage에 둔다
const PENDING_REDIRECT_KEY = 'pendingRedirect';

export const setPendingRedirect = (path) => {
  if (path) sessionStorage.setItem(PENDING_REDIRECT_KEY, path);
};

/** 한 번만 쓰도록 읽으면서 지운다 */
export const consumePendingRedirect = () => {
  const path = sessionStorage.getItem(PENDING_REDIRECT_KEY);
  if (path) sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  return path;
};

export const removeSelectedCommunity = () => {
  deleteItem(SELECTED_COMMUNITY_KEY);
};

export const getMyCommunity = () => {
  try { return JSON.parse(readItem(MY_COMMUNITY_KEY)); } catch { return null; }
};

export const setMyCommunity = (community) => {
  if (community == null) {
    deleteItem(MY_COMMUNITY_KEY);
  } else {
    writeItem(MY_COMMUNITY_KEY, JSON.stringify(community));
  }
};

export const removeMyCommunity = () => {
  deleteItem(MY_COMMUNITY_KEY);
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
  try { return JSON.parse(readItem(COMMUNITY_VISIT_KEY)) || {}; } catch { return {}; }
};

export const recordCommunityVisit = (communityId) => {
  const order = getCommunityVisitOrder();
  order[communityId] = Date.now();
  writeItem(COMMUNITY_VISIT_KEY, JSON.stringify(order));
};

export const sortByRecentVisit = (communities) => {
  const order = getCommunityVisitOrder();
  return [...communities].sort((a, b) => {
    const ta = order[a.communityId] ?? 0;
    const tb = order[b.communityId] ?? 0;
    return tb - ta;
  });
};

// 커뮤니티 응답(CommunityDto.Response)을 로비가 읽는 형태로 골라 저장한다.
// 목록에서 입장할 때, 만든 직후, 초대코드로 참가한 직후 모두 같은 모양이어야 한다.
export const enterCommunity = (community, userId) => {
  recordCommunityVisit(community.communityId);
  setSelectedCommunity({
    communityId: community.communityId,
    name: community.name,
    isAdmin: (community.admins ?? []).some(a => a.memberId === Number(userId)),
    inviteCode: community.inviteCode ?? null,
    imageUrl: community.imageUrl ?? null,
    region: community.region ?? null,
    memberCount: community.memberCount ?? 0,
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
