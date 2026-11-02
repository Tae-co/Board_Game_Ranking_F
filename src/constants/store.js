// 1b 가입 동의 문구 버전. 문구를 바꾸면 올리고 백엔드 StoreService.CONSENT_VERSION도 같이 올린다
export const STORE_CONSENT_VERSION = 1;

// 공유 링크는 토큰 없는 주소 — 열면 구경(2d)이나 매장 홈(2)이고 체크인은 안 된다 (plan-store §6.6)
export const storeShareUrl = (storeId) => `https://yadarank.com/s/${storeId}`;

// 체크인 QR은 매장 지역 시간 정각마다 바뀐다
export const CHECKIN_QR_SLOT_MS = 60 * 60 * 1000;

// 매장 홈 게임 그리드에 먼저 보여 줄 개수 (나머지는 더보기)
export const STORE_GAME_GRID_LIMIT = 4;

// 로비의 입점 매장 미리 보기 개수 (나머지는 "전체 보기" → /stores)
export const STORE_DIRECTORY_PREVIEW = 2;

// 화면에 쓰는 매장 이름. 지점이 있으면 붙인다 (예: 보드게임카페 야다 홍대점)
export const storeTitle = (store) => (store.branch ? `${store.name} ${store.branch}` : store.name);

// 입점 매장 묶음·줄에 쓰는 동네 (주소 앞 두 단어, 예: 서울 마포구). 주소가 없으면 지역
export const storeArea = (store) => {
  const words = (store.address || '').trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 ? `${words[0]} ${words[1]}` : (store.region || '');
};
