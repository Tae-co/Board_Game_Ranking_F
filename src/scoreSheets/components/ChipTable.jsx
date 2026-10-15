import { Minus, Plus, Crown } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { formatChipDelta, chipDeltaColor, formatChipDigits, chipDigitsOf } from '../../utils/chipUtils';

const MAX_BUY_IN_DIGITS = 9;
const MAX_BUY_INS = 99;

const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', margin: '0 0 8px',
};

/**
 * ChipTable - 칩 게임 한 판 입력. 바이인 금액 → 플레이어별 바이인 횟수 → 우승자 → 결과.
 * 우승자가 판돈을 전부 가져간다. 결과 계산은 chipUtils.buyInResults.
 */
const ChipTable = ({ players, buyIn, onBuyInChange, buyIns, onBuyInsChange, winnerId, onWinnerChange, results, readOnly }) => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '16px' }}>
      <p style={sectionLabel}>{t('scoreSheet', 'chipBuyIn')}</p>
      <input
        type="text"
        inputMode="numeric"
        readOnly={readOnly}
        value={formatChipDigits(buyIn)}
        placeholder="10,000"
        onChange={(e) => onBuyInChange(chipDigitsOf(e.target.value, MAX_BUY_IN_DIGITS))}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, textAlign: 'right',
          fontSize: 17, fontWeight: 800, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
          backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`, color: V('--th-text'),
        }}
      />

      <p style={sectionLabel}>{t('scoreSheet', 'chipBuyIns')}</p>
      <div style={{ marginBottom: 20 }}>
        {players.map((player) => {
          const count = buyIns[player.memberId] ?? 1;
          const step = (d) => onBuyInsChange(player.memberId, Math.min(MAX_BUY_INS, Math.max(1, count + d)));
          return (
            <div key={player.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.nickname}
              </span>
              {!readOnly && <StepButton onClick={() => step(-1)} disabled={count <= 1} label="−"><Minus size={16} /></StepButton>}
              <span style={{ width: 32, textAlign: 'center', fontSize: 16, fontWeight: 800, color: V('--th-text') }}>{count}</span>
              {!readOnly && <StepButton onClick={() => step(1)} disabled={count >= MAX_BUY_INS} label="+"><Plus size={16} /></StepButton>}
            </div>
          );
        })}
      </div>

      <p style={sectionLabel}>{t('scoreSheet', 'chipWinner')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {players.map((player) => {
          const isOn = winnerId === player.memberId;
          return (
            <button
              key={player.memberId}
              type="button"
              disabled={readOnly}
              onClick={() => onWinnerChange(player.memberId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 999,
                fontSize: 13, fontWeight: 700, cursor: readOnly ? 'default' : 'pointer',
                border: `1px solid ${isOn ? V('--th-primary') : V('--th-border')}`,
                backgroundColor: isOn ? V('--th-primary') : V('--th-bg'),
                color: isOn ? '#fff' : V('--th-text'),
              }}
            >
              {isOn && <Crown size={13} />}
              {player.nickname}
            </button>
          );
        })}
      </div>

      <p style={sectionLabel}>{t('scoreSheet', 'chipResults')}</p>
      {results ? (
        players.map((player) => (
          <div key={player.memberId} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{player.nickname}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: chipDeltaColor(results[player.memberId]) }}>
              {formatChipDelta(results[player.memberId])}
            </span>
          </div>
        ))
      ) : (
        <p style={{ fontSize: 12, color: V('--th-text-sub'), margin: 0 }}>{t('scoreSheet', 'chipResultsEmpty')}</p>
      )}
    </div>
  );
};

const StepButton = ({ onClick, disabled, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    style={{
      width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-bg'),
      color: disabled ? V('--th-border') : V('--th-text'), cursor: disabled ? 'default' : 'pointer', padding: 0,
    }}
  >
    {children}
  </button>
);

export default ChipTable;
