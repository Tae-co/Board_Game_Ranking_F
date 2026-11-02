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

// QR을 찍고 받은 스캔 티켓. 로그인·동의를 거치는 동안 들고 있다가 가입·체크인에 쓴다.
// 네이티브 OAuth는 외부 브라우저를 다녀오므로 sessionStorage가 아니라 localStorage에 둔다.
// 서버도 24시간 뒤엔 거절하지만, 오래된 티켓이 로비를 매장으로 계속 끌고 가지 않게 여기서도 버린다.
const PENDING_STORE_TICKET_KEY = 'pendingStoreTicket';
const PENDING_STORE_TICKET_TTL_MS = 24 * 60 * 60 * 1000;

export const getPendingStoreTicket = () => {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_STORE_TICKET_KEY));
    if (!pending || Date.now() - pending.savedAt > PENDING_STORE_TICKET_TTL_MS) return null;
    return pending;
  } catch { return null; }
};

export const setPendingStoreTicket = (storeId, ticket) => {
  localStorage.setItem(PENDING_STORE_TICKET_KEY, JSON.stringify({ storeId: Number(storeId), ticket, savedAt: Date.now() }));
};

export const clearPendingStoreTicket = () => {
  localStorage.removeItem(PENDING_STORE_TICKET_KEY);
};

// 첫 방문 화면(1d)에서 "매장에서 게임하기"를 골랐는지. 'store'면 매장 위주 첫 화면(1e)
const LOBBY_FOCUS_KEY = 'lobbyFocus';

export const getLobbyFocus = () => localStorage.getItem(LOBBY_FOCUS_KEY);

export const setLobbyFocus = (focus) => {
  if (focus == null) localStorage.removeItem(LOBBY_FOCUS_KEY);
  else localStorage.setItem(LOBBY_FOCUS_KEY, focus);
};

// 매장 기기 토큰 (plan-store §6.6). 있으면 이 기기는 매장 TV·테이블 기기 모드 — 사람 로그인 없이 기기 화면만 뜬다.
// 해제되면 서버가 401(DEVICE_TOKEN_INVALID)을 주고 지운다
const DEVICE_TOKEN_KEY = 'storeDeviceToken';
export const DEVICE_MODE_CHANGED_EVENT = 'deviceModeChanged';

export const getDeviceToken = () => localStorage.getItem(DEVICE_TOKEN_KEY);

export const setDeviceToken = (token) => {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
  window.dispatchEvent(new Event(DEVICE_MODE_CHANGED_EVENT));
};

export const clearDeviceToken = () => {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  window.dispatchEvent(new Event(DEVICE_MODE_CHANGED_EVENT));
};
