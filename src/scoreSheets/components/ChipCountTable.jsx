import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { formatChipDelta, chipDeltaColor, formatChipDigits, chipDigitsOf, chipDenomColor, chipCountTotal } from '../../utils/chipUtils';

const MAX_START_DIGITS = 9;

const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', margin: '0 0 8px',
};

/**
 * ChipCountTable - 칩 세기 방식 한 판 입력. 1인 시작 칩 → 플레이어별 칩 종류별 남은 개수 → 손익.
 * 손익 = 남은 칩 합계 - 시작 칩. 모두 같은 칩으로 시작하므로 합계는 0이어야 한다 — 아니면 경고만 한다.
 */
const ChipCountTable = ({ players, startChips, onStartChange, denominations, chipCounts, onCountChange, deltas, readOnly }) => {
  const { t } = useLanguage();
  const sum = players.reduce((acc, p) => acc + (deltas[p.memberId] ?? 0), 0);
  const allFilled = players.every(p => deltas[p.memberId] != null);

  return (
    <div style={{ padding: '16px 0 8px' }}>
      <div style={{ padding: '0 16px' }}>
        <p style={sectionLabel}>{t('scoreSheet', 'chipStartPerPlayer')}</p>
        <input
          type="text"
          inputMode="numeric"
          readOnly={readOnly}
          value={formatChipDigits(startChips)}
          placeholder="1,000"
          onChange={(e) => onStartChange(chipDigitsOf(e.target.value, MAX_START_DIGITS))}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, textAlign: 'right',
            fontSize: 17, fontWeight: 800, outline: 'none', boxSizing: 'border-box', marginBottom: 12,
            backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`, color: V('--th-text'),
          }}
        />
        <p style={{ ...sectionLabel, margin: 0 }}>{t('scoreSheet', 'chipRemaining')}</p>
      </div>

      {players.map((player) => (
        <ChipCountRow
          key={player.memberId}
          player={player}
          denominations={denominations}
          counts={chipCounts[player.memberId] ?? {}}
          onCountChange={(denom, digits) => onCountChange(player.memberId, denom, digits)}
          delta={deltas[player.memberId]}
          readOnly={readOnly}
        />
      ))}

      {/* 합계 — 모두 같은 칩으로 시작하므로 누가 딴 만큼 누가 잃는다. 0이 아니면 세다가 틀렸을 가능성이 크다 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 6px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: V('--th-text-sub') }}>{t('scoreSheet', 'chipSum')}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: sum === 0 ? V('--th-text') : chipDeltaColor(sum) }}>
          {formatChipDelta(sum)}
        </span>
      </div>
      {allFilled && sum !== 0 && (
        <p style={{ margin: '0 16px 6px', fontSize: 12, fontWeight: 600, color: '#d97706' }}>
          ⚠️ {t('scoreSheet', 'chipSumWarning')}
        </p>
      )}
    </div>
  );
};

// 한 플레이어의 칩 종류별 남은 개수. 칩을 누르면 1개씩 늘고, 개수 칸에 직접 적을 수도 있다
const ChipCountRow = ({ player, denominations, counts, onCountChange, delta, readOnly }) => {
  const { t } = useLanguage();
  const total = chipCountTotal(counts, denominations);
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${V('--th-border')}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.nickname}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: V('--th-text') }}>
            {total.toLocaleString('en-US')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: delta == null ? V('--th-text-sub') : chipDeltaColor(delta) }}>
            {delta == null ? '—' : formatChipDelta(delta)}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(denominations.length, 6)}, 1fr)`, gap: 6 }}>
        {denominations.map((denom, i) => {
          const value = counts[denom] ?? '';
          const color = chipDenomColor(i);
          return (
            <div key={denom} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onCountChange(denom, String(Math.min(999, Number(value || 0) + 1)))}
                aria-label={t('scoreSheet', 'chipAddOne').replace('{n}', denom.toLocaleString('en-US'))}
                style={{
                  width: 44, height: 44, borderRadius: '50%', cursor: readOnly ? 'default' : 'pointer',
                  backgroundColor: color, color: '#fff', fontSize: denom >= 10000 ? 9 : 11, fontWeight: 800,
                  border: '3px dashed rgba(255,255,255,0.7)', boxShadow: `0 0 0 2px ${color}`,
                  padding: 0, lineHeight: 1,
                }}
              >
                {denom.toLocaleString('en-US')}
              </button>
              <input
                type="text"
                inputMode="numeric"
                readOnly={readOnly}
                value={value}
                placeholder="0"
                onChange={(e) => onCountChange(denom, chipDigitsOf(e.target.value, 3))}
                style={{
                  width: '100%', maxWidth: 52, padding: '5px 4px', borderRadius: 8, textAlign: 'center',
                  fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                  backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`, color: V('--th-text'),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChipCountTable;
