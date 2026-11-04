import { useNavigate } from 'react-router-dom';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { emptyCard, sectionTitle } from '../store/storeStyles';
import { CONTEST_PATH, PILL, contestWhen, pill, shortDate } from './contestUtils';

const cardStyle = {
  width: 300, flexShrink: 0, scrollSnapAlign: 'start', boxSizing: 'border-box',
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '18px',
  display: 'flex', flexDirection: 'column', gap: '14px',
};
const cta = (enabled) => ({
  marginTop: 'auto', height: 48, borderRadius: '14px', border: 'none', cursor: enabled ? 'pointer' : 'default',
  backgroundColor: enabled ? V('--th-primary') : V('--th-bg-deep'), color: enabled ? '#fff' : V('--th-text-sub'),
  fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
});

/** 대회 카드 상태 → [배지, 배지 색, 버튼 문구 키] (시안 2: 모집 중 / 오늘 / 진행 중) */
const contestState = (c, role) => {
  if (c.status === 'PLAYING') return ['badgeLive', PILL.green, role === 'STAFF' ? 'ctaStaff' : 'ctaLive'];
  if (c.status === 'FINISHED') return ['badgeDone', PILL.gray, 'ctaResult'];
  if (c.status === 'CANCELLED') return ['badgeCancelled', PILL.red, c.myStatus ? 'ctaLive' : null];
  const today = c.today;
  const badge = today ? 'badgeToday' : 'badgeRecruiting';
  if (role === 'STAFF') return [badge, PILL.orange, 'ctaStaff'];
  if (role !== 'MEMBER') return [badge, PILL.orange, 'ctaMembersOnly'];
  if (c.myStatus === 'APPLIED') return [badge, PILL.orange, today ? 'ctaToday' : 'ctaApplied'];
  if (c.applied >= c.capacity) return [badge, PILL.orange, 'ctaFull'];
  return [badge, PILL.orange, 'ctaApply'];
};

/**
 * 매장 홈 "이벤트" (시안 2·2d): 하루 대회 카드 + 매장 이벤트 카드를 옆으로 넘긴다. 더보기(onMore)는 늘 → 이벤트 목록.
 * vertical = 이벤트 목록 화면: 제목 없이 세로로 전부 (화면 위 막대가 제목).
 * 구경(2d)은 대회 참가가 잠긴다. 대회 카드는 대회 화면(5a·5b·5d, STAFF는 5e)으로, 매장 이벤트 카드는 자세히 보기로. 둘 다 없으면 빈 카드
 */
const StoreEventCards = ({ storeId, contests = [], events = [], role, t, lang, onMore, vertical = false }) => {
  const navigate = useNavigate();
  const header = !vertical && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={sectionTitle}>{t('contest', 'eventsTitle')}</h2>
      {onMore && (
        <button onClick={onMore} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: V('--th-primary') }}>
          {t('store', 'more')}
        </button>
      )}
    </div>
  );
  if (contests.length === 0 && events.length === 0) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {header}
        <p style={emptyCard}>{t('contest', 'eventsEmpty')}</p>
      </section>
    );
  }
  const card = vertical ? { ...cardStyle, width: '100%' } : cardStyle;
  // 목록 화면은 끝난·취소된 대회를 매장 이벤트 뒤로 (진행 중 → 모집 중 → 매장 이벤트 → 끝남)
  const isDone = (c) => c.status === 'FINISHED' || c.status === 'CANCELLED';
  const active = vertical ? contests.filter(c => !isDone(c)) : contests;
  const done = vertical ? contests.filter(isDone) : [];
  const contestCard = (c) => {
    const [badgeKey, color, ctaKey] = contestState(c, role);
    const locked = ctaKey === 'ctaMembersOnly' || ctaKey === 'ctaFull';
    const open = () => navigate(CONTEST_PATH(storeId, c.id));
    return (
      <div key={`c${c.id}`} style={card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={pill(color)}>{t('contest', badgeKey)}</span>
            {c.roomClosed && c.status === 'RECRUITING' && <span style={pill(PILL.gray)}>{t('contest', 'badgeRoomClosed')}</span>}
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: V('--th-text') }}>{c.title}</span>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'cardWhen'), { when: contestWhen(c.startsAt, lang), a: c.applied, b: c.capacity })}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, backgroundColor: V('--th-bg-deep'), overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (c.applied / c.capacity) * 100)}%`, height: '100%', backgroundColor: V('--th-primary') }} />
        </div>
        {ctaKey && (
          locked
            ? <span style={cta(false)}>{t('contest', ctaKey)}</span>
            : <button onClick={open} style={cta(true)}>{t('contest', ctaKey)}</button>
        )}
      </div>
    );
  };
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {header}
      <div style={vertical
        ? { display: 'flex', flexDirection: 'column', gap: '12px' }
        : { display: 'flex', gap: '12px', marginRight: -20, paddingRight: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {active.map(contestCard)}
        {events.map(e => (
          <div key={`e${e.id}`} style={card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={pill(PILL.blue)}>{t('contest', 'badgeStoreEvent')}</span>
                {e.oneTime && <span style={pill(e.usedAt ? PILL.gray : PILL.orange)}>{t('contest', e.usedAt ? 'badgeCouponUsed' : 'badgeCoupon')}</span>}
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: V('--th-text') }}>{e.title}</span>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
                {fmt(t('contest', 'eventPeriod'), { from: shortDate(e.startsOn), to: shortDate(e.endsOn) })}
              </span>
            </div>
            {e.imageUrl && (
              <img src={e.imageUrl} alt="" style={{ height: 96, borderRadius: '14px', objectFit: 'cover', width: '100%' }} />
            )}
            {e.benefitText && (
              <span style={{
                fontSize: '14px', lineHeight: 1.5, color: V('--th-text'), whiteSpace: 'pre-line',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{e.benefitText}</span>
            )}
            <button onClick={() => navigate(`/store/${storeId}/events/${e.id}`)} style={cta(true)}>{t('contest', 'ctaEventDetail')}</button>
          </div>
        ))}
        {done.map(contestCard)}
      </div>
    </section>
  );
};

export default StoreEventCards;
