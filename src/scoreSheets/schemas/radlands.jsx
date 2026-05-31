import { useState } from 'react';

export const radlandsSchema = {
  name: 'RADLANDS',
  type: 'radlands',
};

export const RadlandsTable = ({ players, onTotalsChange, handleChange, readOnly }) => {
  const [pA, pB] = players;
  const [result, setResult] = useState(null); // 'a' | 'tie' | 'b'

  const select = (r) => {
    if (readOnly) return;
    setResult(r);
    const totals =
      r === 'a'   ? { [pA.memberId]: 2, [pB.memberId]: 1 } :
      r === 'b'   ? { [pA.memberId]: 1, [pB.memberId]: 2 } :
                    { [pA.memberId]: 1, [pB.memberId]: 1 };
    onTotalsChange(totals);
    handleChange('_data', 'all', JSON.stringify({ result: r }));
  };

  const btn = (label, key) => (
    <button
      key={key}
      onClick={() => select(key)}
      disabled={readOnly}
      style={{
        flex: 1,
        padding: '18px 8px',
        borderRadius: 14,
        border: result === key ? '2px solid var(--th-primary)' : '2px solid var(--th-border)',
        background: result === key ? 'var(--th-primary)' : 'var(--th-card)',
        color: result === key ? '#fff' : 'var(--th-text)',
        fontSize: 14,
        fontWeight: 800,
        cursor: readOnly ? 'default' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 700, color: 'var(--th-text)' }}>
        <span>⚔️ {pA?.nickname}</span>
        <span style={{ fontSize: 12, color: 'var(--th-text-sub)', fontWeight: 500 }}>vs</span>
        <span>⚔️ {pB?.nickname}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {btn(pA?.nickname + ' 승리', 'a')}
        {btn('무승부', 'tie')}
        {btn(pB?.nickname + ' 승리', 'b')}
      </div>
    </div>
  );
};
