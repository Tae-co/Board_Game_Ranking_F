import { D, clock } from './deviceTheme';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { DiceLogo, MvpIcon } from '../store/StoreIcons';
import { fmt, num } from '../store/fmt';
import { storeTitle } from '../../constants/store';
import CheckinQrPanel from './CheckinQrPanel';

const TV_W = 1920;
const TV_H = 1080;

const frame = (padding, gap) => ({
  width: TV_W, height: TV_H, boxSizing: 'border-box', padding, display: 'flex', flexDirection: 'column', gap,
});

const cardStyle = { backgroundColor: D.card, border: `1px solid ${D.border}`, borderRadius: '28px' };

/** 4·4i 머리: 로고 + "[매장] 랭킹" · 오른쪽 "[시즌] · 종료까지 N일" */
const RankingHeader = ({ store, season, t }) => (
  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <DiceLogo size={52} />
      <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 700, letterSpacing: '-0.01em' }}>
        {fmt(t('store', 'tvRankingTitle'), { store: storeTitle(store) })}
      </h1>
    </div>
    {season && (
      <span style={{ fontSize: '26px', color: D.accentText }}>{fmt(t('store', 'tvSeasonHeader'), { name: season.name, n: season.daysLeft })}</span>
    )}
  </header>
);

/** 매장 MVP 칸 5개: [kind, 이름표 key, 값, 값 글자] — 4·4b 공통. 최고 승률은 3판 이상만 (없으면 null) */
const mvpCells = (mvp, t, rateKey) => [
  ['VISITS', 'tvMostVisits', mvp?.mostVisits, i => fmt(t('store', 'tvDays'), { n: num(i.count) })],
  ['GAMES', 'tvMostGames', mvp?.mostGames, i => fmt(t('store', 'tvGames'), { n: num(i.count) })],
  ['WINS', 'tvMostWins', mvp?.mostWins, i => fmt(t('store', 'tvWins'), { n: num(i.count) })],
  ['STREAK', 'tvBestStreak', mvp?.bestStreak, i => fmt(t('store', 'tvStreak'), { n: num(i.count) })],
  ['WIN_RATE', 'tvBestWinRate', mvp?.bestWinRate, i => fmt(t('store', rateKey), { p: i.percent, n: num(i.games) })],
];

/** 4 매장 MVP: 윗줄 최다 방문·최다 참여, 아랫줄 최다승·최대 연승·최고 승률 */
export const TvMvp = ({ store, season, mvp, t }) => (
  <div style={frame('56px 64px', '40px')}>
    <RankingHeader store={store} season={season} t={t} />
    <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: D.accentSoft }}>{t('store', 'tvMvpTitle')}</h2>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
        {mvpCells(mvp, t, 'tvWinRateGames').map(([kind, labelKey, item, text], i) => (
          <div key={kind} style={{ ...cardStyle, gridColumn: `span ${i < 2 ? 3 : 2}`, padding: '36px 40px', display: 'flex', alignItems: 'center', gap: '32px', minWidth: 0 }}>
            {item
              ? <MemberDiceAvatar memberId={item.memberId} nickname={item.nickname} size={120} />
              : <span style={{ width: 120, height: 120, borderRadius: 999, flexShrink: 0, backgroundColor: D.border }} />}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '30px', color: D.accentText, fontWeight: 500, whiteSpace: 'nowrap' }}>
                <MvpIcon kind={kind} size={30} />{t('store', labelKey)}
              </span>
              <span style={{ fontSize: '52px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item?.nickname ?? '—'}</span>
              <span style={{ fontSize: '32px', fontWeight: 700, color: D.gold, whiteSpace: 'nowrap' }}>{item ? text(item) : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const rankColor = (rank) => (rank === 1 ? D.gold : rank <= 3 ? D.silver : D.sub);

/** 4i 게임별 TOP 10 (게임 하나) */
export const TvTop10 = ({ store, season, game, t }) => (
  <div style={frame('56px 64px', '40px')}>
    <RankingHeader store={store} season={season} t={t} />
    <section style={{ ...cardStyle, flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 700 }}>{fmt(t('store', 'tvTop10'), { game: game.name })}</h2>
      </div>
      {game.items.map(item => (
        <div key={item.memberId} style={{ height: 64, display: 'flex', alignItems: 'center', gap: '20px', borderTop: `1px solid ${D.border}` }}>
          <span style={{ width: 40, fontSize: '28px', fontWeight: 700, color: rankColor(item.rank) }}>{item.rank}</span>
          <span style={{ flex: 1, fontSize: '28px', fontWeight: 500 }}>{item.nickname}</span>
          <span style={{ fontSize: '28px', fontWeight: 700 }}>{num(item.score)}</span>
        </div>
      ))}
    </section>
  </div>
);

/** 4h 체크인 QR 크게 — TV에서 QR이 뜨는 유일한 화면 */
export const TvQr = ({ store, url, remainingMs, t }) => (
  <div style={frame('72px 120px', '32px')}>
    <header style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <DiceLogo size={52} />
      <span style={{ fontSize: '40px', fontWeight: 700 }}>{storeTitle(store)}</span>
    </header>
    <CheckinQrPanel big url={url} remainingMs={remainingMs} t={t} />
  </div>
);

const signed = (n) => (n > 0 ? `+${num(n)} ▲` : n < 0 ? `−${num(Math.abs(n))}` : '0');

/** 4e 방금 끝난 경기 (8초). 대회 판은 점수 변동 대신 순위 점수 */
export const TvJustFinished = ({ match, t }) => {
  const minutes = match.startedAt && match.endedAt
    ? Math.max(1, Math.round((new Date(match.endedAt) - new Date(match.startedAt)) / 60000)) : null;
  const time = clock(new Date(match.endedAt));
  return (
    <div style={frame('64px 96px', '40px')}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ alignSelf: 'flex-start', fontSize: '26px', fontWeight: 700, padding: '8px 22px', borderRadius: 999, backgroundColor: D.accent, color: D.bg }}>
            {t('store', 'tvJustFinished')}
          </span>
          <h1 style={{ margin: 0, fontSize: '88px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {match.contestTitle ? fmt(t('contest', 'tvJustContest'), { title: match.contestTitle, n: match.contestRound }) : match.gameName}
          </h1>
        </div>
        <span style={{ fontSize: '34px', color: D.accentText }}>
          {fmt(t('store', 'tvJustMeta'), { time, m: minutes ?? '—' })}
        </span>
      </header>
      <section style={{ ...cardStyle, borderRadius: '32px', overflow: 'hidden' }}>
        {match.players.map((p, i) => (
          <div key={`${p.nickname}-${i}`} style={{
            display: 'grid', gridTemplateColumns: '120px 96px minmax(0, 1fr) 260px 260px', alignItems: 'center', gap: '24px',
            padding: '28px 40px', borderTop: i === 0 ? 'none' : `1px solid ${D.border}`,
          }}>
            <span style={{ fontSize: '56px', fontWeight: 700, color: p.placement === 1 ? D.gold : D.text }}>
              {p.placement ? fmt(t('store', 'tvPlace'), { n: p.placement }) : ''}
            </span>
            <MemberDiceAvatar nickname={p.nickname} size={88} />
            <span style={{ fontSize: '52px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
            <span style={{ fontSize: '40px', color: D.accentSoft, textAlign: 'right' }}>
              {p.gameScore != null ? fmt(t('store', 'tvGameScore'), { n: num(p.gameScore) }) : ''}
            </span>
            <span style={{ fontSize: '44px', fontWeight: 700, textAlign: 'right', color: match.contestTitle || p.ratingChange > 0 ? D.up : D.sub }}>
              {match.contestTitle
                ? (p.placement ? fmt(t('contest', 'tvPointsN'), { n: Math.max(0, match.players.length - p.placement + 1) }) : '')
                : p.ratingChange != null ? signed(p.ratingChange) : ''}
            </span>
          </div>
        ))}
      </section>
      <span style={{ marginTop: 'auto', fontSize: '28px', color: D.sub }}>{t('store', 'tvJustFoot')}</span>
    </div>
  );
};

const CrownIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>
);

/** 4b 시즌 결과 (끝나고 1주일): 게임별 우승 4칸 · 매장 MVP 5칸 · 다음 시즌 시작일 */
export const TvSeasonResult = ({ store, result, lang, t }) => {
  const next = new Date(`${result.nextStart}T00:00:00`).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric' });
  return (
    <div style={{ width: TV_W, height: TV_H, boxSizing: 'border-box', padding: '64px', display: 'flex', flexDirection: 'column', gap: '44px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '26px', color: D.accentText }}>{storeTitle(store)}</span>
        <h1 style={{ margin: 0, fontSize: '64px', fontWeight: 700, letterSpacing: '-0.01em' }}>{fmt(t('store', 'tvSeasonFinal'), { name: result.name })}</h1>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '28px' }}>
        {result.winners.slice(0, 4).map(w => (
          <div key={w.boardGameId} style={{ ...cardStyle, padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <CrownIcon />
            <span style={{ fontSize: '26px', color: D.accentText, fontWeight: 500, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fmt(t('store', 'tvWinnerOf'), { game: w.name })}
            </span>
            <MemberDiceAvatar memberId={w.memberId} nickname={w.nickname} size={120} />
            <span style={{ fontSize: '40px', fontWeight: 700, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.nickname ?? t('store', 'leftMember')}</span>
            <span style={{ fontSize: '30px', fontWeight: 700, color: D.gold }}>{num(w.score)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px 28px' }}>
        {mvpCells(result, t, 'tvWinRate').map(([kind, labelKey, item, text]) => (
          <div key={kind} style={{ ...cardStyle, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '26px', color: D.accentText, flexShrink: 0 }}>
              <MvpIcon kind={kind} size={28} />{t('store', labelKey)}
            </span>
            <span style={{ fontSize: '34px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item ? `${item.nickname ?? t('store', 'leftMember')} · ${text(item)}` : '—'}
            </span>
          </div>
        ))}
        <div style={{ borderRadius: '28px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: D.button }}>
          <span style={{ fontSize: '26px', color: D.stepText }}>{t('store', 'tvNextSeason')}</span>
          <span style={{ fontSize: '34px', fontWeight: 700 }}>{fmt(t('store', 'tvNextStart'), { date: next })}</span>
        </div>
      </div>
    </div>
  );
};

export { TV_W, TV_H };
