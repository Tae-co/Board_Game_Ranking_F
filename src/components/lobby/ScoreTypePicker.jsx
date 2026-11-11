import { Trophy, Hash, Swords, Coins } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import ChipDenominationsField from './ChipDenominationsField';

// 점수 방식 4가지 + 칩 게임일 때 바이인/세기 방식과 칩 종류
const ScoreTypePicker = ({ scoreType, setScoreType, chipMode, setChipMode, denominations, setDenominations, t }) => (
  <>
    <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
      {t('lobby', 'customScoreType')}
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: scoreType === 'chip' ? 8 : 24 }}>
      {[
        { key: 'simple', Icon: Trophy, label: t('lobby', 'customTypeSimple'), desc: t('lobby', 'customTypeSimpleDesc') },
        { key: 'flat', Icon: Hash, label: t('lobby', 'customTypeFlat'), desc: t('lobby', 'customTypeFlatDesc') },
        { key: 'outcome', Icon: Swords, label: t('lobby', 'customTypeOutcome'), desc: t('lobby', 'customTypeOutcomeDesc') },
        { key: 'chip', Icon: Coins, label: t('lobby', 'customTypeChip'), desc: t('lobby', 'customTypeChipDesc') },
      ].map((opt) => {
        const selected = scoreType === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setScoreType(opt.key)}
            style={{
              textAlign: 'left', padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
              backgroundColor: V('--th-card'),
              border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
            }}
          >
            <opt.Icon style={{ width: 18, height: 18, color: selected ? 'var(--th-primary)' : V('--th-text-sub'), marginBottom: 6 }} />
            <p style={{
              margin: 0, fontSize: 13, fontWeight: 700,
              color: selected ? V('--th-primary') : V('--th-text'),
            }}>
              {opt.label}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, lineHeight: 1.35, color: V('--th-text-sub') }}>
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>

    {scoreType === 'chip' && (
    <>
        <p style={{ fontSize: 11, color: V('--th-text-sub'), lineHeight: 1.4, margin: '0 0 16px' }}>
          {t('lobby', 'customChipHint')}
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
          {t('lobby', 'customChipMode')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: chipMode === 'count' ? 16 : 24 }}>
          {[
            { key: 'buyin', label: t('lobby', 'customChipModeBuyIn'), desc: t('lobby', 'customChipModeBuyInDesc') },
            { key: 'count', label: t('lobby', 'customChipModeCount'), desc: t('lobby', 'customChipModeCountDesc') },
          ].map((opt) => {
            const selected = chipMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setChipMode(opt.key)}
                style={{
                  textAlign: 'left', padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: V('--th-card'),
                  border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: selected ? V('--th-primary') : V('--th-text') }}>
                  {opt.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, lineHeight: 1.35, color: V('--th-text-sub') }}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
        {chipMode === 'count' && (
          <div style={{ marginBottom: 24 }}>
            <ChipDenominationsField value={denominations} onChange={setDenominations} />
          </div>
        )}
    </>
  )}
  </>
);

export default ScoreTypePicker;
