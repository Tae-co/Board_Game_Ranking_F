import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthUserId } from '../../auth/storage';
import { useCurrentParty, usePartyRealtime } from '../../hooks/useCurrentParty';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

const SIZE = 56;
const EDGE = 8;
// 로그인·QR 진입·관리자 화면엔 띄우지 않는다. 매장 TV(3단계)도 여기에 더한다
const HIDDEN = ['/login', '/s/', '/admin', '/oauth-callback', '/join'];

/** 지금 그룹이 있는 곳: 내가 낀 판이 열려 있으면 그 판, 아니면 그룹 기다리는 화면(3b) */
const partyTarget = (party, myId) => {
  const m = party?.currentMatch;
  if (m && m.participantIds.includes(myId)) return `/store/match/${m.id}`;
  return `/store/${party.store.id}/party`;
};

/**
 * 그룹 바로가기 주사위 (시안 2k). 그룹에 있는 동안 앱 어느 화면에나 떠 있고, 누르면 지금 그룹이 있는 곳으로.
 * 그 화면에 있으면 숨김. 어디든 끌어서 옮긴다. 그룹 변경 실시간 신호도 여기서 한 번만 받는다
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

  if (!party || HIDDEN.some(p => pathname.startsWith(p))) return null;
  const target = partyTarget(party, myId);
  if (pathname === target) return null;

  const x = pos?.x ?? window.innerWidth - SIZE - 16;
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
        if (!moved) navigate(target);
      }}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 150, width: SIZE, height: SIZE, borderRadius: 999,
        border: 'none', cursor: 'grab', touchAction: 'none', backgroundColor: V('--th-primary'),
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
