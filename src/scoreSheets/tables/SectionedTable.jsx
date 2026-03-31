import ScoreCell from '../shared/ScoreCell';
import TotalRow from '../shared/TotalRow';
import { cl } from '../shared/scoreUtils';

const SectionedTable = ({ schema, players, scores, totals, winnerId, handleChange, t, lang, readOnly }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 80 }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => (
          <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: "#F5E6D0", minWidth: 64 }}>
            {p.nickname}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {schema.sections.map((section) => {
        const sectionTotals = players.reduce((acc, p) => {
          acc[p.memberId] = section.categories.reduce((s, c) => s + (Number(scores[c.key]?.[p.memberId]) || 0), 0);
          return acc;
        }, {});
        return (
          <>
            <tr key={`sh-${section.key}`}>
              <td colSpan={players.length + 1} style={{
                padding: "7px 8px", fontSize: 11, fontWeight: 900,
                color: section.color, background: section.bgColor,
                borderTop: `3px solid ${section.color}`, letterSpacing: "0.05em"
              }}>
                {section.icon} {cl(section, lang)}
              </td>
            </tr>
            {section.categories.map((cat, idx) => (
              <tr key={cat.key} style={{ background: idx % 2 === 0 ? "var(--th-card)" : section.bgColor + "55" }}>
                <td style={{ padding: "7px 4px 7px 16px", fontSize: 11, fontWeight: 700, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
                  <span style={{ marginRight: 3 }}>{cat.icon}</span>
                  <span style={{ color: cat.color }}>{cl(cat, lang)}</span>
                </td>
                {players.map(p => (
                  <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
                    <ScoreCell cat={cat} memberId={p.memberId} value={scores[cat.key]?.[p.memberId]} onChange={handleChange} onOpenScience={() => {}} readOnly={readOnly} />
                  </td>
                ))}
              </tr>
            ))}
            <tr key={`st-${section.key}`} style={{ background: section.bgColor }}>
              <td style={{ padding: "6px 8px 6px 16px", fontSize: 11, fontWeight: 800, color: section.color, borderBottom: `2px solid ${section.color}` }}>
                {t('scoreSheet', 'subtotal')}
              </td>
              {players.map(p => (
                <td key={p.memberId} style={{ padding: "6px 4px", textAlign: "center", fontWeight: 800, fontSize: 13, color: section.color, borderBottom: `2px solid ${section.color}` }}>
                  {sectionTotals[p.memberId]}
                </td>
              ))}
            </tr>
          </>
        );
      })}
      <TotalRow players={players} totals={totals} winnerId={winnerId} t={t} />
    </tbody>
  </table>
);

export default SectionedTable;
