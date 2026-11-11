import { Plus, Minus } from 'lucide-react';
import { V } from '../../utils/cssUtils';

// 최소·최대 인원 +/- 버튼 (가운데 숫자 칸은 읽기 전용)
const PlayerCountField = ({ minPlayers, setMinPlayers, maxPlayers, setMaxPlayers, t }) => (
  <>
    <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
      {t('lobby', 'customPlayers')}
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      {[
        // min은 max를 넘을 수 없고, max는 min 아래로 내려갈 수 없다 (버튼·입력 공용 경계)
        { key: 'min', value: minPlayers, set: setMinPlayers, label: t('lobby', 'customMinPlayers'), lo: 1, hi: maxPlayers },
        { key: 'max', value: maxPlayers, set: setMaxPlayers, label: t('lobby', 'customMaxPlayers'), lo: minPlayers, hi: 20 },
      ].map((f) => {
        const clamp = (n) => Math.max(f.lo, Math.min(f.hi, n));
        const atLo = f.value <= f.lo;
        const atHi = f.value >= f.hi;
        return (
        <div key={f.key} style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: V('--th-text-sub'), marginBottom: 4 }}>
            {f.label}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              aria-label={`${f.label} -1`}
              disabled={atLo}
              onClick={() => f.set(clamp(f.value - 1))}
              style={{
                flex: '0 0 auto', width: 38, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                color: V('--th-text'), cursor: atLo ? 'default' : 'pointer', opacity: atLo ? 0.4 : 1,
              }}
            >
              <Minus size={16} />
            </button>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={f.value}
              style={{
                flex: 1, minWidth: 0, width: '100%', padding: '10px 4px', borderRadius: 10,
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                color: V('--th-text'), fontSize: 14, textAlign: 'center', outline: 'none',
                boxSizing: 'border-box', cursor: 'default', userSelect: 'none',
              }}
            />
            <button
              type="button"
              aria-label={`${f.label} +1`}
              disabled={atHi}
              onClick={() => f.set(clamp(f.value + 1))}
              style={{
                flex: '0 0 auto', width: 38, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                color: V('--th-text'), cursor: atHi ? 'default' : 'pointer', opacity: atHi ? 0.4 : 1,
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        );
      })}
    </div>
    <p style={{ fontSize: 11, color: V('--th-text-sub'), lineHeight: 1.4, margin: '0 0 24px' }}>
      {t('lobby', 'customPlayersHint')}
    </p>
  </>
);

export default PlayerCountField;
