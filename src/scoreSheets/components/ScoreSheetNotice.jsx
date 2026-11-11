const primaryButton = { padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-primary)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 700 };
const secondaryButton = { padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-card)", color: "var(--th-text)", border: "1px solid var(--th-border)", cursor: "pointer", fontWeight: 700 };

/**
 * 점수판을 그릴 수 없을 때 화면 전체에 띄우는 안내 (잘못된 접근 / 불러오기 실패 / 점수판 없음).
 * title이 없으면 한 줄 안내만 보여 준다. actions: [{ label, onClick, secondary? }]
 */
const ScoreSheetNotice = ({ emoji, title, desc, actions }) => (
  <div style={{
    minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--th-bg)",
    ...(title ? { padding: 24, textAlign: "center" } : {}),
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
    {title ? (
      <>
        <p style={{ color: "var(--th-text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</p>
        <p style={{ color: "var(--th-text-sub)", fontSize: 13, marginBottom: 24 }}>{desc}</p>
      </>
    ) : (
      <p style={{ color: "var(--th-text-sub)", marginBottom: 24 }}>{desc}</p>
    )}
    <div style={{ display: 'flex', gap: 8 }}>
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick} style={a.secondary ? secondaryButton : primaryButton}>
          {a.label}
        </button>
      ))}
    </div>
  </div>
);

export default ScoreSheetNotice;
