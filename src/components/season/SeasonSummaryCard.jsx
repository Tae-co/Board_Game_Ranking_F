import { forwardRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import AwardIcon from './AwardIcon';
import { V } from '../../utils/cssUtils';
import { fill } from '../../utils/seasonUtils';

/**
 * 공유용 모임 현황 카드 (전체 기간, plan-season-reset §22). 화면 테마를 그대로 따르고,
 * 공유 이미지도 캡처한 사람의 테마로 나간다.
 */
const CARD_WIDTH = 340;

// 히어로 이미지가 아래 본문(카드색)으로 이어지도록 카드색으로 페이드한다. 글씨는 페이드된 아래쪽에 앉는다.
const HERO_FADE = {
  dark: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.45) 60%, rgba(26,26,46,0.1) 100%)',
  light: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.05) 100%)',
};

const AWARD_META = {
  LAST_WINNER: { labelKey: 'awardLastWinner' },
  MOST_WINS: { labelKey: 'awardMostWins' },
  LONGEST_STREAK: { labelKey: 'awardLongestStreak' },
  LONGEST_LOSING_STREAK: { labelKey: 'awardLongestLosingStreak' },
  BEST_WIN_RATE: { labelKey: 'awardBestWinRate' },
  MOST_PLAYED: { labelKey: 'awardMostPlayed' },
  MOST_RECORDED: { labelKey: 'awardMostRecorded' },
};

// 강조색은 다크 배경 기준으로 고른 색이라 흰 카드 위에선 안 읽힌다 — 라이트용으로 한 톤 진하게 둔다.
const AWARD_ACCENT = {
  dark: {
    LAST_WINNER: '#FBBF24', MOST_WINS: '#FBBF24', LONGEST_STREAK: '#F87171',
    LONGEST_LOSING_STREAK: '#94A3B8', BEST_WIN_RATE: '#34D399', MOST_PLAYED: '#818CF8', MOST_RECORDED: '#38BDF8',
  },
  light: {
    LAST_WINNER: '#D97706', MOST_WINS: '#D97706', LONGEST_STREAK: '#DC2626',
    LONGEST_LOSING_STREAK: '#64748B', BEST_WIN_RATE: '#059669', MOST_PLAYED: '#4F46E5', MOST_RECORDED: '#0284C7',
  },
};
const PODIUM_ACCENT = {
  dark: { 1: '#FFD700', 2: '#C8C8D4', 3: '#D4936A' },
  light: { 1: '#B7791F', 2: '#6B7280', 3: '#A0522D' },
};
const PODIUM_TINT = { 1: 'rgba(255,215,0,0.10)', 2: 'rgba(200,200,212,0.08)', 3: 'rgba(212,147,106,0.08)' };
const PODIUM_EDGE = { 1: 'rgba(255,215,0,0.35)', 2: 'rgba(200,200,212,0.28)', 3: 'rgba(212,147,106,0.28)' };

const SeasonSummaryCard = forwardRef(({ summary }, ref) => {
  const { t } = useLanguage();
  const { themeKey } = useTheme();
  const tone = themeKey === 'ledger' ? 'dark' : 'light';

  const leaders = summary.leaders ?? [];

  const formatAwardValue = (award) => {
    switch (award.type) {
      case 'LAST_WINNER':
        return award.boardGameName;
      case 'MOST_WINS':
        return fill(t('season', award.value === 1 ? 'winsUnitOne' : 'winsUnit'), { count: award.value });
      case 'LONGEST_STREAK':
        return fill(t('season', 'streakUnit'), { count: award.value });
      case 'LONGEST_LOSING_STREAK':
        return fill(t('season', 'losingStreakUnit'), { count: award.value });
      case 'BEST_WIN_RATE':
        return `${Math.round(award.value)}%`;
      case 'MOST_RECORDED':
        return fill(t('season', 'recordedUnit'), { count: award.value });
      default:
        return fill(t('season', 'gamesUnit'), { count: award.value });
    }
  };

  return (
    <div
      ref={ref}
      style={{
        width: CARD_WIDTH,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: V('--th-card'),
        border: `1px solid var(--th-border)`,
        fontFamily: 'inherit',
        boxShadow: tone === 'dark' ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 24px rgba(17,24,39,0.08)',
      }}
    >
      {/* Hero */}
      <div style={{ position: 'relative', height: 132, backgroundColor: V('--th-card') }}>
        {summary.communityImageUrl ? (
          <img
            src={summary.communityImageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: HERO_FADE[tone],
        }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: V('--th-text-sub') }}>
            {t('season', 'allTimeLabel').toUpperCase()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 23, fontWeight: 800, color: V('--th-text'), letterSpacing: '-0.3px' }}>
            {summary.communityName}
          </p>
        </div>
      </div>

      {/* 게임별 최고 점수 — 칸마다 다른 게임. 점수가 카드의 머리기사라 수상 위에 온다.
          그 방·게임에서 3판 이상 뛴 사람이 없으면 서버가 빈 목록을 준다. */}
      <div style={{ padding: '14px 20px 0' }}>
        {leaders.length > 0 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {leaders.map((entry) => (
              <div
                key={`${entry.rank}-${entry.memberId}`}
                style={{
                  flex: 1, minWidth: 0, textAlign: 'center',
                  padding: '10px 6px', borderRadius: 12,
                  backgroundColor: PODIUM_TINT[entry.rank] || 'rgba(255,255,255,0.05)',
                  border: `1px solid ${PODIUM_EDGE[entry.rank] || 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {/* 칸마다 게임이 다르다 — 어느 게임 점수인지 밝힌다. */}
                <p style={{
                  margin: 0, minHeight: 14, fontSize: 10, fontWeight: 700, lineHeight: '14px',
                  color: V('--th-text-sub'),
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.boardGameName}
                </p>
                <p style={{
                  margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: V('--th-text'),
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.nickname}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 13, fontWeight: 800, color: PODIUM_ACCENT[tone][entry.rank] }}>
                  {Math.round(entry.displayScore).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            margin: 0, padding: '9px 12px', borderRadius: 10, textAlign: 'center',
            fontSize: 11, fontWeight: 600, color: V('--th-text-sub'),
            backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
          }}>
            {t('season', 'noLeaders')}
          </p>
        )}
      </div>

      {/* Awards */}
      <div style={{ padding: '10px 20px 4px' }}>
        {summary.awards.map((award) => {
          const meta = AWARD_META[award.type];
          if (!meta) return null;
          return (
            <div
              key={`${award.type}-${award.memberId}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 8,
                borderRadius: 12, backgroundColor: V('--th-bg'),
                border: `1px solid var(--th-border)`,
              }}
            >
              <AwardIcon type={award.type} color={AWARD_ACCENT[tone][award.type]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: V('--th-text-sub') }}>
                  {t('season', meta.labelKey)}
                </p>
                <p style={{
                  margin: '2px 0 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: V('--th-text'),
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {formatAwardValue(award)}
                </p>
              </div>
              <span style={{
                maxWidth: '45%', fontSize: 15, fontWeight: 800, color: AWARD_ACCENT[tone][award.type], flexShrink: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {award.nickname}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 10, padding: '12px 20px 14px',
        borderTop: `1px solid var(--th-border)`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: V('--th-text-sub') }}>
          YADA RANK
        </span>
      </div>
    </div>
  );
});

SeasonSummaryCard.displayName = 'SeasonSummaryCard';

export default SeasonSummaryCard;
