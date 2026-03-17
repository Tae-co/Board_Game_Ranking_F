const TotalRow = ({ players, totals, winnerId, t }) => (
  <tr style={{ background: "#2C1F0E" }}>
    <td style={{ padding: "10px 8px", fontWeight: 900, color: "var(--th-primary)", fontSize: 13 }}>{t('scoreSheet', 'total')}</td>
    {players.map(p => (
      <td key={p.memberId} style={{ padding: "10px 4px", textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: p.memberId === winnerId ? "var(--th-primary)" : "#F5E6D0" }}>{totals[p.memberId]}</div>
      </td>
    ))}
  </tr>
);

export default TotalRow;
