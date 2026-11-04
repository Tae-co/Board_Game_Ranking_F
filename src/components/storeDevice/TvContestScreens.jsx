import { D } from './deviceTheme';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { fmt, num } from '../store/fmt';
import { storeTitle } from '../../constants/store';
import { contestWhen, shortDate } from '../contest/contestUtils';
import { TV_H, TV_W } from './TvScreens';

const cardStyle = { backgroundColor: D.card, border: `1px solid ${D.border}`, borderRadius: '32px' };

/**
 * 4d 매장 이벤트 · 모집 중 대회 (6k 순서의 "매장 이벤트" 칸에서 한 화면씩 번갈아).
 * 대회는 일시·인원·판 수·상품 + "앱의 매장 홈에서 참가 신청" (TV에 참가 QR 없음). dots = [지금, 전체]
 */
export const TvStoreEvent = ({ store, event, contest, dots, lang, t }) => {
  const isContest = !!contest;
  const [badgeBg, badgeColor] = isContest ? ['#FFF1E6', '#B4500A'] : ['#E0F2FE', '#075985'];
  const title = isContest ? contest.title : event.title;
  const when = isContest
    ? fmt(t('contest', 'tvContestWhen'), { when: contestWhen(contest.startsAt, lang), a: contest.applied, b: contest.capacity, r: contest.rounds })
    : fmt(t('contest', 'eventPeriod'), { from: shortDate(event.startsOn), to: shortDate(event.endsOn) });
  const body = isContest
    ? (contest.prizeText ? fmt(t('contest', 'tvContestBody'), { prize: contest.prizeText }) : t('contest', 'tvContestBodyNoPrize'))
    : event.benefitText;
  const image = isContest ? null : event.imageUrl;
  return (
    <div style={{ width: TV_W, height: TV_H, boxSizing: 'border-box', padding: '64px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '64px' }}>
      <div style={{ ...cardStyle, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 700, color: D.sub }}>
        {image
          ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{isContest ? contest.gameName : storeTitle(store)}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 0', minWidth: 0 }}>
        <span style={{ fontSize: '26px', color: D.accentText }}>{storeTitle(store)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <span style={{ alignSelf: 'flex-start', fontSize: '26px', fontWeight: 700, padding: '8px 22px', borderRadius: 999, backgroundColor: badgeBg, color: badgeColor }}>
            {t('contest', isContest ? 'tvContestBadge' : 'badgeStoreEvent')}
          </span>
          <h1 style={{ margin: 0, fontSize: '96px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{title}</h1>
          <span style={{ fontSize: '34px', color: D.accentSoft }}>{when}</span>
          {body && <p style={{ margin: 0, fontSize: '36px', lineHeight: 1.5, color: D.silver, whiteSpace: 'pre-line' }}>{body}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} aria-hidden="true">
          {dots[1] > 1 && Array.from({ length: dots[1] }, (_, i) => (
            <span key={i} style={{ width: i === dots[0] ? 48 : 14, height: 14, borderRadius: 999, backgroundColor: i === dots[0] ? D.accent : D.dot }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** 4g 대회 순위: 판별 순위 점수표·합계·게임 점수 합. 진행 중엔 순위표, 끝난 뒤 1시간은 최종 순위 */
export const TvContestBoard = ({ board, t }) => {
  const cols = `100px 96px minmax(0, 1fr) repeat(${board.rounds}, 140px) 200px`;
  const playing = board.status === 'PLAYING';
  const rows = board.standings.slice(0, 6);
  return (
    <div style={{ width: TV_W, height: TV_H, boxSizing: 'border-box', padding: '64px 96px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <span style={{ alignSelf: 'flex-start', fontSize: '26px', fontWeight: 700, padding: '8px 22px', borderRadius: 999, backgroundColor: D.accent, color: '#FFFFFF' }}>
            {fmt(t('contest', 'tvBoardBadge'), { n: board.rounds, d: board.roundsDone })}
          </span>
          <h1 style={{ margin: 0, fontSize: '88px', fontWeight: 700, letterSpacing: '-0.02em' }}>{board.title}</h1>
        </div>
        <span style={{ fontSize: '34px', color: D.accentText }}>
          {playing ? fmt(t('contest', 'tvBoardPlaying'), { n: Math.min(board.rounds, board.roundsDone + 1) }) : t('contest', 'tvBoardDone')}
        </span>
      </header>
      <section style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: '24px', padding: '20px 40px', fontSize: '28px', color: D.sub }}>
          <span /><span /><span />
          {Array.from({ length: board.rounds }, (_, i) => <span key={i} style={{ textAlign: 'center' }}>{fmt(t('contest', 'roundN'), { n: i + 1 })}</span>)}
          <span style={{ textAlign: 'right' }}>{t('contest', 'total')}</span>
        </div>
        {rows.map((s, i) => (
          <div key={s.memberId ?? i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: '24px', padding: '24px 40px', borderTop: `1px solid ${D.border}` }}>
            <span style={{ fontSize: '56px', fontWeight: 700, color: s.rank === 1 ? D.gold : D.text }}>{s.rank}</span>
            <MemberDiceAvatar memberId={s.memberId} nickname={s.nickname} size={80} />
            <span style={{ fontSize: '48px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nickname ?? t('contest', 'leftMember')}</span>
            {s.points.map((p, r) => (
              <span key={r} style={{ fontSize: '44px', textAlign: 'center', color: p == null ? D.foot : D.text }}>{p ?? '–'}</span>
            ))}
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontSize: '56px', fontWeight: 700, color: D.accentText }}>{s.total}</span>
              <span style={{ fontSize: '24px', color: D.sub }}>{fmt(t('contest', 'gameScoreN'), { n: num(Math.round(s.gameScore)) })}</span>
            </span>
          </div>
        ))}
      </section>
      <span style={{ marginTop: 'auto', fontSize: '28px', color: D.sub }}>{t('contest', 'tvBoardFoot')}</span>
    </div>
  );
};
