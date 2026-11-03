import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthUserId } from '../../auth/storage';
import { useCurrentParty, usePartyRealtime } from '../../hooks/useCurrentParty';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

const SIZE = 56;
const EDGE = 8;
// 놓으면 왼쪽·오른쪽 끝에서 이만큼 떨어져 붙는다
const SIDE = 16;
// 로그인·QR 진입·관리자·매장 기기(4j) 화면엔 띄우지 않는다
const HIDDEN = ['/login', '/s/', '/admin', '/oauth-callback', '/join', '/device'];

/** 그룹 화면 두 곳: 3b 그룹 만들기·기다리기, 2i 오늘의 그룹(관리) */
const partyScreens = (storeId) => [`/store/${storeId}/party`, `/store/${storeId}/party/manage`];

/**
 * 지금 그룹이 있는 곳: 대회 중이면 대회 화면(5b), 내가 낀 판이 열려 있으면 그 판,
 * 아니면 마지막으로 있던 그룹 화면(3b·2i, 처음엔 3b)
 */
const partyTarget = (party, myId, lastScreen) => {
  if (party.contestId) return `/store/${party.store.id}/contest/${party.contestId}`;
  const m = party?.currentMatch;
  if (m && m.participantIds.includes(myId)) return `/store/match/${m.id}`;
  return lastScreen ?? partyScreens(party.store.id)[0];
};

/**
 * 그룹 바로가기 주사위 (시안 2k). 그룹에 있는 동안 앱 어느 화면에나 떠 있고, 누르면 지금 그룹이 있는 곳으로.
 * 그 화면이나 그룹 화면(3b·2i)에 있으면 숨김. 끌어서 옮기고, 놓으면 가까운 왼쪽·오른쪽 끝에 붙는다. 그룹 변경 실시간 신호도 여기서 한 번만 받는다
 */
const PartyBubble = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const { data: party } = useCurrentParty(!!myId);
  usePartyRealtime(party?.id);
  const [pos, setPos] = useState(null);
  const drag = useRef(null);
  // 마지막으로 있던 그룹 화면. 그룹이 바뀌면 버린다
  const [lastScreen, setLastScreen] = useState(null);
  const storeId = party?.store.id;
  if (storeId && partyScreens(storeId).includes(pathname) && (lastScreen?.partyId !== party.id || lastScreen.path !== pathname)) {
    setLastScreen({ partyId: party.id, path: pathname });
  }

  if (!party || HIDDEN.some(p => pathname.startsWith(p))) return null;
  const target = partyTarget(party, myId, lastScreen?.partyId === party.id ? lastScreen.path : null);
  if (pathname === target || partyScreens(storeId).includes(pathname)) return null;

  // 끄는 중엔 x 그대로, 놓은 뒤엔 붙은 쪽(side)으로 계산해서 화면 폭이 바뀌어도 끝에 붙어 있다
  const edgeX = (side) => (side === 'left' ? SIDE : window.innerWidth - SIZE - SIDE);
  const x = pos?.x ?? edgeX(pos?.side);
  const y = pos?.y ?? Math.round(window.innerHeight * 0.45);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  return (
    <button
      aria-label={t('store', 'bubbleAria')}
      onPointerDown={(e) => {
        drag.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.sx;
        const dy = e.clientY - d.sy;
        if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
        if (d.moved) {
          setPos({
            x: clamp(d.ox + dx, EDGE, window.innerWidth - SIZE - EDGE),
            y: clamp(d.oy + dy, 64, window.innerHeight - SIZE - EDGE),
          });
        }
      }}
      onPointerUp={() => {
        const moved = drag.current?.moved;
        drag.current = null;
        if (!moved) {
          navigate(target);
          return;
        }
        setPos({ side: x + SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right', y });
      }}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 150, width: SIZE, height: SIZE, borderRadius: 999,
        border: 'none', cursor: 'grab', touchAction: 'none', backgroundColor: V('--th-primary'),
        transition: pos?.x != null ? 'none' : 'left 0.2s ease-out',
        boxShadow: `0 6px 18px rgba(${V('--th-primary-rgb')}, 0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.3" fill="#fff" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="#fff" stroke="none" />
        <circle cx="15.5" cy="15.5" r="1.3" fill="#fff" stroke="none" />
      </svg>
    </button>
  );
};

export default PartyBubble;
