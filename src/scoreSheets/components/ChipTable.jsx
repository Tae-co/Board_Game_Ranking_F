import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { formatChipDelta, chipDeltaColor, formatChipDigits, chipDigitsOf, chipDenomColor, chipCountTotal } from '../../utils/chipUtils';

const MAX_DIGITS = 9;

const inputStyle = {
  width: 104, flexShrink: 0, padding: '8px 10px', borderRadius: 8, textAlign: 'right',
  fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
  backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`,
};

/**
 * ChipTable - 플레이어별 이번 판 칩 증감을 입력한다.
 * type: 'chip' 커스텀 점수판에서 사용. 합계가 0이 아니면 경고만 하고 저장은 막지 않는다.
 *
 * mode 'count': 판이 끝나고 칩 종류별로 남은 개수를 적으면, 그 합계와 판 시작 칩(stackBefore)의 차이로 증감을 계산한다.
 * mode 'delta': 딴(+)/잃은(-) 금액을 직접 적는다. 매치 수정·읽기 화면은 판 시작 칩을 알 수 없어 이것만 쓴다.
 * onModeChange가 없으면 토글을 숨긴다.
 */
const ChipTable = ({ players, mode, onModeChange, stackBefore, denominations, chipCounts, onCountChange, chipInputs, onChange, deltas, readOnly }) => {
  const { t } = useLanguage();

  const sum = players.reduce((acc, p) => acc + (deltas[p.memberId] ?? 0), 0);
  const allFilled = players.every(p => deltas[p.memberId] != null);
  const isCount = mode === 'count';

  return (
    <div style={{ padding: '8px 0' }}>
      {onModeChange && (
        <div style={{ margin: '4px 16px 8px', display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${V('--th-border')}` }}>
          {['count', 'delta'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              style={{
                flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: mode === m ? V('--th-primary') : V('--th-card'),
                color: mode === m ? '#fff' : V('--th-text-sub'),
              }}
            >
              {t('scoreSheet', m === 'count' ? 'chipModeCount' : 'chipModeDelta')}
            </button>
          ))}
        </div>
      )}

      {players.map((player) => {
        const delta = deltas[player.memberId];
        if (isCount) {
          return (
            <ChipCountRow
              key={player.memberId}
              player={player}
              before={stackBefore?.[player.memberId]}
              denominations={denominations}
              counts={chipCounts[player.memberId] ?? {}}
              onCountChange={(denom, digits) => onCountChange(player.memberId, denom, digits)}
              delta={delta}
            />
          );
        }
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
            <DeltaInput
              input={chipInputs[player.memberId] ?? { sign: '+', amount: '' }}
              onChange={(input) => onChange(player.memberId, input)}
              readOnly={readOnly}
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

// 한 플레이어의 칩 종류별 남은 개수 (칩 개수 모드). 칩을 누르면 1개씩 늘고, 개수 칸에 직접 적을 수도 있다
const ChipCountRow = ({ player, before, denominations, counts, onCountChange, delta }) => {
  const { t } = useLanguage();
  const total = chipCountTotal(counts, denominations);
  const loading = before == null;
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${V('--th-border')}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.nickname}
          </div>
          <div style={{ fontSize: 11, color: V('--th-text-sub'), marginTop: 1 }}>
            {loading ? '…' : t('scoreSheet', 'chipStackBefore').replace('{n}', before.toLocaleString('en-US'))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: V('--th-text') }}>
            {total == null ? '—' : total.toLocaleString('en-US')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: delta == null ? V('--th-text-sub') : chipDeltaColor(delta) }}>
            {delta == null ? t('scoreSheet', 'chipCountEmpty') : formatChipDelta(delta)}
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
                disabled={loading}
                onClick={() => onCountChange(denom, String(Math.min(999, Number(value || 0) + 1)))}
                aria-label={t('scoreSheet', 'chipAddOne').replace('{n}', denom.toLocaleString('en-US'))}
                style={{
                  width: 44, height: 44, borderRadius: '50%', cursor: loading ? 'default' : 'pointer',
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
                disabled={loading}
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

// +/− 버튼 + 금액 칸 (직접 입력 모드)
const DeltaInput = ({ input, onChange, readOnly }) => {
  const { t } = useLanguage();
  return (
    <>
      <div style={{ display: 'flex', flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${V('--th-border')}` }}>
        {['+', '-'].map((sign) => {
          const isOn = input.sign === sign;
          const color = sign === '+' ? '#16a34a' : '#dc2626';
          return (
            <button
              key={sign}
              type="button"
              disabled={readOnly}
              onClick={() => onChange({ ...input, sign })}
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
        value={formatChipDigits(input.amount)}
        placeholder="0"
        onChange={(e) => onChange({ ...input, amount: chipDigitsOf(e.target.value, MAX_DIGITS) })}
        style={{
          ...inputStyle,
          color: input.amount ? (input.sign === '-' ? '#dc2626' : '#16a34a') : V('--th-text'),
        }}
      />
    </>
  );
};

export default ChipTable;
