import { V } from '../../utils/cssUtils';
import { MvpIcon } from './StoreIcons';
import { fmt } from './fmt';
import { emptyCard } from './storeStyles';

const Tile = ({ kind, label, name, sub }) => (
  <div style={{ backgroundColor: V('--th-bg'), borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: V('--th-primary') }}>
      <MvpIcon kind={kind} /><span style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
    <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ?? '-'}</span>
    <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{sub}</span>
  </div>
);

const count = (item, key, t) => (item ? fmt(t('store', key), { n: item.count }) : '');

/** 이번 시즌 매장 MVP (시안 2): 최다 방문 · 최다 참여 / 최다승 · 최대 연승 · 최고 승률(3판 이상). 기록이 없으면(mvp null) 빈 카드 */
const StoreMvp = ({ mvp, t }) => {
  if (!mvp) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'mvpTitle')}</h2>
        <p style={emptyCard}>{t('store', 'mvpEmpty')}</p>
      </section>
    );
  }
  const rate = mvp.bestWinRate;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'mvpTitle')}</h2>
      <div style={{
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '16px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          <Tile kind="VISITS" label={t('store', 'mvpVisits')} name={mvp.mostVisits?.nickname} sub={count(mvp.mostVisits, 'mvpVisitsCount', t)} />
          <Tile kind="GAMES" label={t('store', 'mvpGames')} name={mvp.mostGames?.nickname} sub={count(mvp.mostGames, 'mvpGamesCount', t)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
          <Tile kind="WINS" label={t('store', 'mvpWins')} name={mvp.mostWins?.nickname} sub={count(mvp.mostWins, 'mvpWinsCount', t)} />
          <Tile kind="STREAK" label={t('store', 'mvpStreak')} name={mvp.bestStreak?.nickname} sub={count(mvp.bestStreak, 'mvpStreakCount', t)} />
          <Tile kind="WIN_RATE" label={t('store', 'mvpWinRate')} name={rate?.nickname}
            sub={rate ? fmt(t('store', 'mvpWinRateCount'), { p: rate.percent, n: rate.games }) : ''} />
        </div>
      </div>
    </section>
  );
};

export default StoreMvp;
