import { forwardRef } from 'react';
import { Flame, TrendingUp, Trophy } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { V } from '../../utils/cssUtils';

/**
 * 공유용 결산 카드. 화면 테마를 그대로 따르고, 공유 이미지도 캡처한 사람의 테마로 나간다.
 */
const CARD_WIDTH = 340;

// 히어로 이미지가 아래 본문(카드색)으로 이어지도록 카드색으로 페이드한다. 글씨는 페이드된 아래쪽에 앉는다.
const HERO_FADE = {
  dark: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.45) 60%, rgba(26,26,46,0.1) 100%)',
  light: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.05) 100%)',
};

// 이모지는 기기 폰트에 따라 ? 상자로 깨진다 — SVG 아이콘으로 그린다.
const AWARD_META = {
  MOST_WINS: { Icon: Trophy, labelKey: 'awardMostWins' },
  LONGEST_STREAK: { Icon: Flame, labelKey: 'awardLongestStreak' },
  DARK_HORSE: { Icon: TrendingUp, labelKey: 'awardDarkHorse' },
};

// 강조색은 다크 배경 기준으로 고른 색이라 흰 카드 위에선 안 읽힌다 — 라이트용으로 한 톤 진하게 둔다.
const AWARD_ACCENT = {
  dark: { MOST_WINS: '#FBBF24', LONGEST_STREAK: '#F87171', DARK_HORSE: '#818CF8' },
  light: { MOST_WINS: '#D97706', LONGEST_STREAK: '#DC2626', DARK_HORSE: '#4F46E5' },
};
const PODIUM_ACCENT = {
  dark: { 1: '#FFD700', 2: '#C8C8D4', 3: '#D4936A' },
  light: { 1: '#B7791F', 2: '#6B7280', 3: '#A0522D' },
};
const PODIUM_TINT = { 1: 'rgba(255,215,0,0.10)', 2: 'rgba(200,200,212,0.08)', 3: 'rgba(212,147,106,0.08)' };
const PODIUM_EDGE = { 1: 'rgba(255,215,0,0.35)', 2: 'rgba(200,200,212,0.28)', 3: 'rgba(212,147,106,0.28)' };

const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const SeasonSummaryCard = forwardRef(({ summary }, ref) => {
  const { t, lang } = useLanguage();
  const { themeKey } = useTheme();
  const tone = themeKey === 'ledger' ? 'dark' : 'light';

  // 결산 브랜치 시절 응답에는 podium이 없다 — 옛 캐시로 렌더될 때 터지지 않게 기본값을 둔다.
  const podium = summary.podium ?? [];

  const [year, month] = summary.period.split('-');
  const monthLabel = lang === 'ko'
    ? `${year}년 ${Number(month)}월 결산`
    : new Date(Number(year), Number(month) - 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' Recap';

  const formatAwardValue = (award) => {
    if (award.type === 'MOST_WINS') {
      const key = award.value === 1 ? 'winsUnitOne' : 'winsUnit';
      return fill(t('season', key), { count: award.value });
    }
    if (award.type === 'LONGEST_STREAK') {
      return fill(t('season', 'streakUnit'), { count: award.value });
    }
    const rounded = Math.round(award.value);
    return `${rounded >= 0 ? '+' : ''}${rounded}`;
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
            {monthLabel.toUpperCase()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 23, fontWeight: 800, color: V('--th-text'), letterSpacing: '-0.3px' }}>
            {summary.communityName}
          </p>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px 4px' }}>
        <Stat value={summary.totalRooms} label={t('season', 'roomsLabel')} />
        <Stat value={summary.totalMembers} label={t('season', 'membersLabel')} />
      </div>

      {/* Podium — 시상대는 수상 3종 위에 온다. 순위가 카드의 머리기사이기 때문이다 (기획 §6).
          참가자 3명 미만이면 서버가 빈 목록을 주고, 그때는 시상 조건을 한 줄로 알린다 (§4). */}
      <div style={{ padding: '10px 20px 0' }}>
        {podium.length > 0 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {podium.map((entry) => (
              <div
                key={`${entry.rank}-${entry.memberId}`}
                style={{
                  flex: 1, minWidth: 0, textAlign: 'center',
                  padding: '10px 6px', borderRadius: 12,
                  backgroundColor: PODIUM_TINT[entry.rank] || 'rgba(255,255,255,0.05)',
                  border: `1px solid ${PODIUM_EDGE[entry.rank] || 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {/* 모임 시상대는 사람마다 최고 점수를 낸 방이 다르다 — 어느 방 점수인지 밝힌다.
                    방이 지워졌으면 이름이 없지만 칸 높이는 맞춘다. */}
                <p style={{
                  margin: 0, minHeight: 14, fontSize: 10, fontWeight: 700, lineHeight: '14px',
                  color: V('--th-text-sub'),
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.roomName}
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
            {t('season', 'awardNeedsPlayers')}
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
              key={award.type}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 8,
                borderRadius: 12, backgroundColor: V('--th-bg'),
                border: `1px solid var(--th-border)`,
              }}
            >
              <meta.Icon size={18} color={AWARD_ACCENT[tone][award.type]} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: V('--th-text-sub') }}>
                  {t('season', meta.labelKey)}
                </p>
                <p style={{
                  margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: V('--th-text'),
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {award.nickname}
                </p>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: AWARD_ACCENT[tone][award.type], flexShrink: 0 }}>
                {formatAwardValue(award)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer — 초대코드가 카드에 각인되어 나간다 */}
      <div style={{
        marginTop: 10, padding: '12px 20px 14px',
        borderTop: `1px solid var(--th-border)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: V('--th-text-sub') }}>
          YADA RANK
        </span>
        {summary.inviteCode && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: V('--th-text-sub') }}>
              {t('season', 'inviteCode').toUpperCase()}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: V('--th-text'), letterSpacing: '0.1em' }}>
              {summary.inviteCode}
            </span>
          </span>
        )}
      </div>
    </div>
  );
});

const Stat = ({ value, label }) => (
  <div style={{
    flex: 1, borderRadius: 12, padding: '10px 12px',
    backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
  }}>
    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: V('--th-text'), lineHeight: 1.1 }}>{value}</p>
    <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: V('--th-text-sub') }}>{label}</p>
  </div>
);

SeasonSummaryCard.displayName = 'SeasonSummaryCard';

export default SeasonSummaryCard;
