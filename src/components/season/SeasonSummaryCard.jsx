import { forwardRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * 공유용 결산 카드. html2canvas로 이미지화되므로 테마 변수를 쓰지 않고
 * 리터럴 색상만 사용한다 (라이트/다크 어디서 캡처해도 같은 이미지가 나오도록).
 */
const CARD_WIDTH = 340;

const AWARD_META = {
  MOST_WINS: { emoji: '🏆', labelKey: 'awardMostWins', accent: '#FBBF24' },
  LONGEST_STREAK: { emoji: '🔥', labelKey: 'awardLongestStreak', accent: '#F87171' },
  DARK_HORSE: { emoji: '🐎', labelKey: 'awardDarkHorse', accent: '#818CF8' },
};

// 시상대 색. 카드는 html2canvas로 이미지가 되므로 테마 변수를 쓸 수 없다.
const PODIUM_EMOJI = { 1: '🥇', 2: '🥈', 3: '🥉' };
const PODIUM_ACCENT = { 1: '#FFD700', 2: '#C8C8D4', 3: '#D4936A' };
const PODIUM_TINT = { 1: 'rgba(255,215,0,0.10)', 2: 'rgba(200,200,212,0.08)', 3: 'rgba(212,147,106,0.08)' };
const PODIUM_EDGE = { 1: 'rgba(255,215,0,0.35)', 2: 'rgba(200,200,212,0.28)', 3: 'rgba(212,147,106,0.28)' };

const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const SeasonSummaryCard = forwardRef(({ summary }, ref) => {
  const { t, lang } = useLanguage();

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
        backgroundColor: '#141426',
        fontFamily: 'inherit',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
    >
      {/* Hero */}
      <div style={{ position: 'relative', height: 132, backgroundColor: '#2a1f6e' }}>
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
          background: 'linear-gradient(to top, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.35) 60%, rgba(10,10,20,0.1) 100%)',
        }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)' }}>
            {monthLabel.toUpperCase()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
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
                <div style={{ fontSize: 17, lineHeight: 1.1 }}>{PODIUM_EMOJI[entry.rank]}</div>
                <p style={{
                  margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.nickname}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 13, fontWeight: 800, color: PODIUM_ACCENT[entry.rank] }}>
                  {Math.round(entry.displayScore).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            margin: 0, padding: '9px 12px', borderRadius: 10, textAlign: 'center',
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
            backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
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
                borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>{meta.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>
                  {t('season', meta.labelKey)}
                </p>
                <p style={{
                  margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {award.nickname}
                </p>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: meta.accent, flexShrink: 0 }}>
                {formatAwardValue(award)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer — 초대코드가 카드에 각인되어 나간다 */}
      <div style={{
        marginTop: 10, padding: '12px 20px 14px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }}>
          YADA RANK
        </span>
        {summary.inviteCode && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
              {t('season', 'inviteCode').toUpperCase()}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>
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
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
  }}>
    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{value}</p>
    <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{label}</p>
  </div>
);

SeasonSummaryCard.displayName = 'SeasonSummaryCard';

export default SeasonSummaryCard;
