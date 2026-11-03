import { useNavigate } from 'react-router-dom';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { sectionTitle } from '../store/storeStyles';
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
 * 매장 홈 "진행 중 이벤트" (시안 2·2d): 하루 대회 카드 + 매장 이벤트 카드를 옆으로 넘긴다.
 * 구경(2d)은 대회 참가가 잠긴다. 대회 카드는 대회 화면(5a·5b·5d, STAFF는 5e)으로
 */
const StoreEventCards = ({ storeId, contests = [], events = [], role, t, lang }) => {
  const navigate = useNavigate();
  if (contests.length === 0 && events.length === 0) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={sectionTitle}>{t('contest', 'eventsTitle')}</h2>
      <div style={{ display: 'flex', gap: '12px', marginRight: -20, paddingRight: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {contests.map(c => {
          const [badgeKey, color, ctaKey] = contestState(c, role);
          const locked = ctaKey === 'ctaMembersOnly' || ctaKey === 'ctaFull';
          const open = () => navigate(CONTEST_PATH(storeId, c.id));
          return (
            <div key={`c${c.id}`} style={cardStyle}>
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
        })}
        {events.map(e => (
          <div key={`e${e.id}`} style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={pill(PILL.blue)}>{t('contest', 'badgeStoreEvent')}</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: V('--th-text') }}>{e.title}</span>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
                {fmt(t('contest', 'eventPeriod'), { from: shortDate(e.startsOn), to: shortDate(e.endsOn) })}
              </span>
            </div>
            {e.imageUrl && (
              <img src={e.imageUrl} alt="" style={{ marginTop: 'auto', height: 96, borderRadius: '14px', objectFit: 'cover', width: '100%' }} />
            )}
            {e.benefitText && (
              <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text'), whiteSpace: 'pre-line' }}>{e.benefitText}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StoreEventCards;
