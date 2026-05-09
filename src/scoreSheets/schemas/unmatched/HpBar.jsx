const HpBar = ({ hp, maxHp }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = hp <= 0 ? '#6b7280' : hp <= 3 ? '#dc2626' : hp <= 6 ? '#f97316' : '#16a34a';
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'var(--th-border)', overflow: 'hidden', margin: '4px 0' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.2s, background 0.2s' }} />
    </div>
  );
};

export default HpBar;
