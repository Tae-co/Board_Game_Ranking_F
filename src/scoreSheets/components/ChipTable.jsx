import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { formatChipDelta, chipDeltaColor, chipDeltaOf } from '../../utils/chipUtils';

const MAX_DIGITS = 9;

/**
 * ChipTable - 플레이어별로 이번 판에 딴(+)/잃은(-) 칩을 입력한다.
 * type: 'chip' 커스텀 점수판에서 사용. 합계가 0이 아니면 경고만 하고 저장은 막지 않는다.
 */
const ChipTable = ({ players, chipInputs, onChange, readOnly }) => {
  const { t } = useLanguage();

  const sum = players.reduce((acc, p) => acc + (chipDeltaOf(chipInputs[p.memberId]) ?? 0), 0);
  const allFilled = players.every(p => chipDeltaOf(chipInputs[p.memberId]) != null);

  return (
    <div style={{ padding: '8px 0' }}>
      {players.map((player) => {
        const input = chipInputs[player.memberId] ?? { sign: '+', amount: '' };
        const setSign = (sign) => onChange(player.memberId, { ...input, sign });
        return (
          <div
            key={player.memberId}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderBottom: `1px solid ${V('--th-border')}`,
            }}
          >
            <span style={{
              flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: V('--th-text'),
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {player.nickname}
            </span>
            <div style={{ display: 'flex', flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${V('--th-border')}` }}>
              {['+', '-'].map((sign) => {
                const isOn = input.sign === sign;
                const color = sign === '+' ? '#16a34a' : '#dc2626';
                return (
                  <button
                    key={sign}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setSign(sign)}
                    aria-label={sign === '+' ? t('scoreSheet', 'chipGain') : t('scoreSheet', 'chipLoss')}
                    style={{
                      width: 36, height: 36, border: 'none', fontSize: 18, fontWeight: 800,
                      cursor: readOnly ? 'default' : 'pointer',
                      backgroundColor: isOn ? color : V('--th-bg'),
                      color: isOn ? '#fff' : V('--th-text-sub'),
                    }}
                  >
                    {sign === '+' ? '+' : '−'}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              inputMode="numeric"
              readOnly={readOnly}
              value={input.amount}
              placeholder="0"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS).replace(/^0+(?=\d)/, '');
                onChange(player.memberId, { ...input, amount: digits });
              }}
              style={{
                width: 96, flexShrink: 0, padding: '8px 10px', borderRadius: 8, textAlign: 'right',
                fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`,
                color: input.amount ? (input.sign === '-' ? '#dc2626' : '#16a34a') : V('--th-text'),
              }}
            />
          </div>
        );
      })}

      {/* 합계 — 포커처럼 누가 딴 만큼 누가 잃으므로 0이어야 한다. 아니면 입력 실수일 가능성이 크다 */}
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

export default ChipTable;
