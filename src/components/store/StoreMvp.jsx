import { V } from '../../utils/cssUtils';
import { fmt, num } from './fmt';
import { emptyCard } from './storeStyles';

const Tile = ({ icon, label, name, sub }) => (
  <div style={{ backgroundColor: V('--th-bg'), borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: V('--th-primary') }}>
      {icon}<span style={{ fontSize: '12px', fontWeight: 700 }}>{label}</span>
    </div>
    <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ?? '-'}</span>
    <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{sub}</span>
  </div>
);

const svg = (d) => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const CalendarIcon = () => svg(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>);
const DiceIcon = () => svg(<><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /></>);
const TrophyIcon = () => svg(<><path d="M8 4h8v5a4 4 0 01-8 0z" /><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M9 20h6" /></>);

/** 이번 시즌 매장 MVP (시안 2): 최다 방문 · 최다 참여 · 게임별 1위 가로 넘김. 기록이 없으면(mvp null) 빈 카드 */
const StoreMvp = ({ mvp, t }) => {
  if (!mvp) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'mvpTitle')}</h2>
        <p style={emptyCard}>{t('store', 'mvpEmpty')}</p>
      </section>
    );
  }
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'mvpTitle')}</h2>
      <div style={{
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '16px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          <Tile icon={<CalendarIcon />} label={t('store', 'mvpVisits')} name={mvp.mostVisits?.nickname}
            sub={mvp.mostVisits ? fmt(t('store', 'mvpVisitsCount'), { n: mvp.mostVisits.count }) : ''} />
          <Tile icon={<DiceIcon />} label={t('store', 'mvpGames')} name={mvp.mostGames?.nickname}
            sub={mvp.mostGames ? fmt(t('store', 'mvpGamesCount'), { n: mvp.mostGames.count }) : ''} />
        </div>
        {mvp.gameLeaders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: V('--th-primary'), paddingBottom: 8 }}>
              <TrophyIcon /><span style={{ fontSize: '12px', fontWeight: 700 }}>{t('store', 'mvpLeaders')}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginRight: -16, paddingRight: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {mvp.gameLeaders.map(g => (
                <div key={g.boardGameId} style={{
                  width: 132, flexShrink: 0, scrollSnapAlign: 'start', boxSizing: 'border-box', backgroundColor: V('--th-bg'),
                  borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-primary') }}>{g.name}</span>
                  <span style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: V('--th-bg-deep') }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{g.nickname}</span>
                  <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'pointsUnit'), { n: num(g.score) })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StoreMvp;
