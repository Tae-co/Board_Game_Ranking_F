import { Share2, CheckCheck } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { formatChipDelta } from '../../utils/chipUtils';

/** 점수판 저장 직후 로비로 돌아왔을 때 보이는 이번 경기 점수 변화 */
const MatchResultBanner = ({ matchResult, chip, copied, onShare, t }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ borderRadius: 12, padding: 14, backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-primary'), margin: 0 }}>🎮 {t('ranking', 'matchResult')}</p>
        <button
          onClick={onShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)',
            border: '1px solid var(--th-primary)', cursor: 'pointer',
          }}
        >
          {copied
            ? <CheckCheck size={13} color="#22c55e" />
            : <Share2 size={13} color="var(--th-primary)" />}
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--th-primary)' }}>
            {copied ? t('invite', 'shareCopied') : t('ranking', 'shareResult')}
          </span>
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {matchResult.map((r) => (
          <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: V('--th-bg') }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{r.nickname}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.ratingChange > 0 ? '#16a34a' : '#dc2626' }}>
              {chip ? formatChipDelta(r.ratingChange) : `${r.ratingChange > 0 ? '+' : ''}${Math.round(r.ratingChange)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MatchResultBanner;
