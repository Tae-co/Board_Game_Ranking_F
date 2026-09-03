import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import api from '../axios';
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

// 세션 = 앱이 로드된 한 번. 앱을 껐다 켜면 새 세션이다.
const sessionId = crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// 네이티브 빌드 버전. 웹에서는 getInfo가 없어 null로 남는다.
let appVersion = null;
CapApp.getInfo().then(info => { appVersion = info.version; }).catch(() => {});

/**
 * 행동 이벤트 기록. 계측은 제품 기능이 아니므로 응답을 기다리지 않고,
 * 실패해도 호출부에 영향을 주지 않는다.
 */
export const logEvent = (eventName, payload = {}) => {
  api.post('/events', {
    eventName,
    anonId: getAnonId(),
    sessionId,
    platform: Capacitor.getPlatform(),
    appVersion,
    ...payload,
  }).catch(() => {});
};
