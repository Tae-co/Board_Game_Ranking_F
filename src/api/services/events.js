import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import api, { ensureToken } from '../axios';
import { getAnonId } from '../../utils/storage';

// 백엔드 EventName enum과 1:1로 맞춘다. 여기 없는 이름은 서버가 202로 받고 조용히 버린다.
export const EVENTS = Object.freeze({
  COMMUNITY_CREATE_STARTED: 'COMMUNITY_CREATE_STARTED',
  COMMUNITY_CREATE_COMPLETED: 'COMMUNITY_CREATE_COMPLETED',
  COMMUNITY_JOIN_COMPLETED: 'COMMUNITY_JOIN_COMPLETED',
  ROOM_CREATE_STARTED: 'ROOM_CREATE_STARTED',
  ROOM_CREATE_COMPLETED: 'ROOM_CREATE_COMPLETED',
  MATCH_FORM_OPENED: 'MATCH_FORM_OPENED',
  SCORE_SHEET_OPENED: 'SCORE_SHEET_OPENED',
  MATCH_SUBMITTED: 'MATCH_SUBMITTED',
  RANKING_VIEWED: 'RANKING_VIEWED',
  INVITE_SCREEN_OPENED: 'INVITE_SCREEN_OPENED',
  INVITE_LANDING_OPENED: 'INVITE_LANDING_OPENED',
  APP_OPENED: 'APP_OPENED',
});

// 세션 = 앱이 로드된 한 번, 또는 오래 백그라운드에 있다가 돌아온 뒤(App.jsx).
const newSessionId = () =>
  crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

let sessionId = newSessionId();

export const startNewSession = () => { sessionId = newSessionId(); };

// StrictMode는 개발에서 이펙트를 두 번 실행하고, 리마운트도 같은 이벤트를 연달아 만든다.
// 같은 이벤트가 같은 차원으로 1초 안에 반복되면 한 번만 보낸다 —
// 사용자가 실제로 화면을 다시 여는 간격은 그보다 훨씬 길다.
const DEDUPE_WINDOW_MS = 1000;
const lastSentAt = new Map();

const isDuplicate = (key) => {
  const now = Date.now();
  const previous = lastSentAt.get(key);
  lastSentAt.set(key, now);
  return previous != null && now - previous < DEDUPE_WINDOW_MS;
};

// 네이티브 빌드 버전. 웹에서는 getInfo가 없어 null로 남는다.
let appVersion = null;
CapApp.getInfo().then(info => { appVersion = info.version; }).catch(() => {});

/**
 * 행동 이벤트 기록. 계측은 제품 기능이 아니므로 응답을 기다리지 않고,
 * 실패해도 호출부에 영향을 주지 않는다.
 */
export const logEvent = (eventName, payload = {}) => {
  if (isDuplicate(`${eventName}:${JSON.stringify(payload)}`)) return;

  // 콜드 스타트 직후에는 accessToken이 아직 없다 — ensureToken이 /auth/refresh 왕복 중이다.
  // 그대로 보내면 로그인 사용자의 이벤트까지 member_id NULL로 저장된다.
  ensureToken().finally(() => {
    api.post('/events', {
      eventName,
      anonId: getAnonId(),
      sessionId,
      platform: Capacitor.getPlatform(),
      appVersion,
      ...payload,
    }).catch(() => {});
  });
};
