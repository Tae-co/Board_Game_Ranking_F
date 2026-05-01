const TotalRow = ({ players, totals, winnerId, t }) => (
  <tr style={{ background: "var(--th-primary)" }}>
    <td style={{ padding: "10px 8px", fontWeight: 900, color: "var(--th-card)", fontSize: 13 }}>{t('scoreSheet', 'total')}</td>
    {players.map(p => (
      <td key={p.memberId} style={{ padding: "10px 4px", textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: p.memberId === winnerId ? "#FFD700" : "var(--th-card)" }}>{totals[p.memberId]}</div>
      </td>
    ))}
  </tr>
);

export default TotalRow;
