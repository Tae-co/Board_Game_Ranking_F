import { forwardRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * 공유용 결산 카드. html2canvas로 이미지화되므로 테마 변수를 쓰지 않고
 * 리터럴 색상만 사용한다 (라이트/다크 어디서 캡처해도 같은 이미지가 나오도록).
 */
const CARD_WIDTH = 340;

const AWARD_META = {
  MOST_WINS: { emoji: '🏆', labelKey: 'awardMostWins', accent: '#FBBF24' },
  BIGGEST_CLIMB: { emoji: '📈', labelKey: 'awardBiggestClimb', accent: '#34D399' },
  DARK_HORSE: { emoji: '🐎', labelKey: 'awardDarkHorse', accent: '#818CF8' },
};

const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const SeasonSummaryCard = forwardRef(({ summary }, ref) => {
  const { t, lang } = useLanguage();

  const [year, month] = summary.period.split('-');
  const monthLabel = lang === 'ko'
    ? `${year}년 ${Number(month)}월 결산`
    : new Date(Number(year), Number(month) - 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' Recap';

  const formatAwardValue = (award) => {
    if (award.type === 'MOST_WINS') {
      return fill(t('season', 'winsUnit'), { count: award.value });
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
        <Stat value={summary.totalMatches} label={t('season', 'matchesLabel')} />
        <Stat value={summary.totalPlayers} label={t('season', 'playersLabel')} />
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

      {/* Game tops */}
      {summary.gameTops.length > 0 && (
        <div style={{ padding: '6px 20px 4px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
            {t('season', 'gameTops').toUpperCase()}
          </p>
          {summary.gameTops.slice(0, 5).map((top) => (
            <div
              key={top.boardGameId}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}
            >
              <span style={{
                flex: 1, minWidth: 0, fontSize: 12, color: 'rgba(255,255,255,0.62)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {top.boardGameName}
              </span>
              <span style={{
                maxWidth: 110, fontSize: 12, fontWeight: 700, color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {top.nickname}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', flexShrink: 0, width: 34, textAlign: 'right' }}>
                {top.wins}
              </span>
            </div>
          ))}
        </div>
      )}

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
