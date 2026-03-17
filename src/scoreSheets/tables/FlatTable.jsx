import ScoreCell from '../shared/ScoreCell';
import TotalRow from '../shared/TotalRow';
import { cl } from '../shared/scoreUtils';

const FlatTable = ({ schema, players, scores, totals, winnerId, handleChange, setScienceModal, t, lang, readOnly }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 80 }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => (
          <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: p.memberId === winnerId ? "var(--th-primary)" : "#F5E6D0", minWidth: 64 }}>
            {p.memberId === winnerId ? "👑 " : ""}{p.nickname}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {schema.categories.map((cat, idx) => (
        <tr key={cat.key} style={{ background: idx % 2 === 0 ? "var(--th-card)" : "var(--th-bg)" }}>
          <td style={{ padding: "8px 4px 8px 8px", fontSize: 11, fontWeight: 700, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
            <span style={{ marginRight: 3 }}>{cat.icon}</span>
            <span style={{ color: cat.color }}>{cl(cat, lang)}</span>
            {cat.negative && !cat.allowNegative && <span style={{ fontSize: 9, color: "#ef4444", marginLeft: 2 }}>({t('scoreSheet', 'negative')})</span>}
          </td>
          {players.map(p => (
            <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
              <ScoreCell cat={cat} memberId={p.memberId} value={scores[cat.key]?.[p.memberId]} onChange={handleChange} onOpenScience={(id) => setScienceModal({ memberId: id })} readOnly={readOnly} />
            </td>
          ))}
        </tr>
      ))}
      <TotalRow players={players} totals={totals} winnerId={winnerId} t={t} />
    </tbody>
  </table>
);

export default FlatTable;
