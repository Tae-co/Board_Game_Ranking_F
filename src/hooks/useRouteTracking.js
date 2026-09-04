import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { EVENTS, logEvent } from '../api/services/events';

// 경로 → 진입 이벤트. 이 앱은 화면이 곧 의도(intent)라서 라우트 한 곳에 모을 수 있다.
// 페이지 파일 7개를 각각 고치지 않아도 되고, 라우트가 바뀌면 여기만 보면 된다.
//
// SCORE_SHEET_OPENED는 예외로 ScoreSheet.jsx가 직접 찍는다. 같은 경로로 수정·읽기전용·
// 미리보기가 들어오는데(location.state로만 구분된다) 그것들은 제출로 이어지지 않아
// 이탈률의 분모를 오염시킨다. 라우트 훅은 state를 볼 수 없다.
const ROUTE_EVENTS = [
  [/^\/login$/, () => ({ eventName: EVENTS.LOGIN_STARTED })],
  [/^\/create-community$/, () => ({ eventName: EVENTS.COMMUNITY_CREATE_STARTED })],
  [/^\/create-group$/, () => ({ eventName: EVENTS.ROOM_CREATE_STARTED })],
  // 경로 이름은 /invite지만 실제로는 그룹 로비다 — 랭킹·매치기록·기록 시작이 다 여기 있다.
  [/^\/invite\/(\d+)$/, m => ({ eventName: EVENTS.GROUP_LOBBY_OPENED, roomId: Number(m[1]) })],
  [/^\/join$/, () => ({ eventName: EVENTS.INVITE_LANDING_OPENED })],
];

/** 라우트 진입을 이벤트로 기록한다. BrowserRouter 안에서만 쓸 수 있다. */
export const useRouteTracking = (isAuthenticated) => {
  const { pathname } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    // 보호된 라우트는 비인증이면 App이 곧바로 /login으로 돌려보낸다 — 사용자가 본 적 없는
    // 화면이다. /join과 /login은 로그인 전이 정상이라 예외로 둔다.
    if (!isAuthenticated && pathname !== '/join' && pathname !== '/login') return;

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    for (const [pattern, build] of ROUTE_EVENTS) {
      const matched = pathname.match(pattern);
      if (!matched) continue;
      const { eventName, ...dimensions } = build(matched);
      logEvent(eventName, dimensions);
      return;
    }
  }, [pathname, isAuthenticated]);
};
