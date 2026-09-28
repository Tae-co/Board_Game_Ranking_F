import { PartyPopper } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { fill, periodMonthLabel, seasonProgress } from '../../utils/seasonUtils';

/**
 * 진행 중인 시즌의 헤더. 경계는 서버에 묻지 않고 커뮤니티 region 타임존으로 계산한다 (기획 §8).
 *
 * `compact`는 랭킹 탭용 한 줄이다 — 리셋이 있다는 사실을 매일 보는 자리라 빠지면 안 되지만,
 * 거기서 진행바까지 두면 정작 현재 순위가 안 읽힌다 (§6).
 */
const SeasonHeader = ({ region, myRankPosition, myScore, compact = false, justReset = false, onViewPastSeason, t, lang }) => {
  const { seasonKey, daysLeft, percent } = seasonProgress(region);
  const monthLabel = fill(t('season', 'currentSeason'), { month: periodMonthLabel(seasonKey, lang) });
  const deadline = daysLeft === 0 ? t('season', 'lastDay') : fill(t('season', 'daysLeft'), { n: daysLeft });

  if (compact) {
    // 리셋 직후에는 랭킹이 전원 500이라 빈 화면처럼 보인다 (§11-3).
    // 그게 정상이라는 것과 지난 기록이 어디 있는지를 이 줄에서 알려준다.
    if (justReset) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10,
          padding: '9px 12px', borderRadius: 12,
          backgroundColor: 'color-mix(in srgb, var(--th-primary) 8%, transparent)',
          border: `1px solid color-mix(in srgb, var(--th-primary) 35%, transparent)`,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: V('--th-text') }}>
            <PartyPopper size={14} color={V('--th-primary')} strokeWidth={2.4} style={{ flexShrink: 0 }} />
            {monthLabel} · {t('season', 'newSeasonStarted')}
          </span>
          <button
            onClick={onViewPastSeason}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 11, fontWeight: 800, color: 'var(--th-primary)', whiteSpace: 'nowrap',
            }}
          >
            {t('season', 'viewPastSeason')} ›
          </button>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 11, fontWeight: 700, color: V('--th-text-sub'),
      }}>
        <span style={{ color: 'var(--th-primary)' }}>{monthLabel}</span>
        <span>·</span>
        <span>{deadline}</span>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 14, padding: '14px 14px 16px', backgroundColor: V('--th-card'),
      border: `1px solid var(--th-border)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: V('--th-text') }}>{monthLabel}</span>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: daysLeft === 0 ? '#dc2626' : 'var(--th-primary)',
        }}>
          {deadline}
        </span>
      </div>

      <div style={{ height: 6, borderRadius: 999, backgroundColor: V('--th-border'), overflow: 'hidden' }}>
        <div style={{
          width: `${percent}%`, height: '100%', borderRadius: 999,
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
        }} />
      </div>

      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: V('--th-text-sub') }}>
        {myRankPosition
          ? fill(t('season', 'myRankLine'), {
              rank: myRankPosition,
              score: Math.round(myScore ?? 0).toLocaleString(),
            })
          : t('season', 'myRankNone')}
      </div>
    </div>
  );
};

export default SeasonHeader;
