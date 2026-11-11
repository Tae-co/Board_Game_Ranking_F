/** 점수 입력 ↔ 순위 입력 전환 (supportsRankMode 게임만) */
const InputModeToggle = ({ rankMode, onScoreMode, onRankMode, t }) => (
  <div style={{ margin: "16px 16px 12px", display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid var(--th-border)" }}>
    {[
      { active: !rankMode, onClick: onScoreMode, label: t('scoreSheet', 'scoreInput') },
      { active: rankMode, onClick: onRankMode, label: t('scoreSheet', 'rankInput') },
    ].map(tab => (
      <button
        key={tab.label}
        onClick={tab.onClick}
        style={{
          flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
          background: tab.active ? "var(--th-primary)" : "var(--th-card)",
          color: tab.active ? "#fff" : "var(--th-text-sub)",
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default InputModeToggle;
