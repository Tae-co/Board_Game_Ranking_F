import { V } from '../../utils/cssUtils';

/** 프로필의 승 / 패 / 최고 점수 세 칸 */
const ProfileStats = ({ wins, losses, bestScore }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
    {[
      { label: 'WINS', value: wins, color: V('--th-text') },
      { label: 'LOSSES', value: losses, color: V('--th-text') },
      { label: 'BEST SCORE', value: bestScore.toLocaleString(), color: 'var(--th-primary)' },
    ].map(({ label, value, color }) => (
      <div key={label} style={{
        borderRadius: 16, padding: '16px 8px',
        backgroundColor: V('--th-card'),
        border: `1px solid var(--th-border)`,
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.06em', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color }}>
          {value}
        </div>
      </div>
    ))}
  </div>
);

export default ProfileStats;
