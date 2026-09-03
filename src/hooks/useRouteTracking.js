import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { EVENTS, logEvent } from '../api/services/events';

// 경로 → 진입 이벤트. 이 앱은 화면이 곧 의도(intent)라서 라우트 한 곳에 모을 수 있다.
// 페이지 파일 7개를 각각 고치지 않아도 되고, 라우트가 바뀌면 여기만 보면 된다.
const ROUTE_EVENTS = [
  [/^\/create-community$/, () => ({ eventName: EVENTS.COMMUNITY_CREATE_STARTED })],
  [/^\/create-group$/, () => ({ eventName: EVENTS.ROOM_CREATE_STARTED })],
  [/^\/match-form\/(\d+)$/, m => ({ eventName: EVENTS.MATCH_FORM_OPENED, roomId: Number(m[1]) })],
  [/^\/score-sheet\/(\d+)$/, m => ({ eventName: EVENTS.SCORE_SHEET_OPENED, boardGameId: Number(m[1]) })],
  [/^\/ranking\/(\d+)$/, m => ({ eventName: EVENTS.RANKING_VIEWED, roomId: Number(m[1]) })],
  [/^\/invite\/(\d+)$/, m => ({ eventName: EVENTS.INVITE_SCREEN_OPENED, roomId: Number(m[1]) })],
  [/^\/join$/, () => ({ eventName: EVENTS.INVITE_LANDING_OPENED })],
];

/** 라우트 진입을 이벤트로 기록한다. BrowserRouter 안에서만 쓸 수 있다. */
export const useRouteTracking = () => {
  const { pathname } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    for (const [pattern, build] of ROUTE_EVENTS) {
      const matched = pathname.match(pattern);
      if (!matched) continue;
      const { eventName, ...dimensions } = build(matched);
      logEvent(eventName, dimensions);
      return;
    }
  }, [pathname]);
};
