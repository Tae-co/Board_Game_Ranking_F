import { useState, useRef, useEffect } from "react";
import { useLanguage } from '../../i18n/LanguageContext';

export const ScienceModal = ({ onConfirm, onClose }) => {
  const { t } = useLanguage();
  const [gear, setGear] = useState(0);
  const [compass, setCompass] = useState(0);
  const [tablet, setTablet] = useState(0);
  const score = gear * gear + compass * compass + tablet * tablet + Math.min(gear, compass, tablet) * 7;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: "0 0 4px", color: "#1C1208", fontSize: 18, fontWeight: 800 }}>{`🟢 ${t('scoreSheet', 'scienceTitle')}`}</h3>
        <p style={{ margin: "0 0 20px", color: "#8B7355", fontSize: 12 }}>{t('scoreSheet', 'scienceDesc')}</p>
        {[
          { label: "⚙️ 기어", val: gear, set: setGear },
          { label: "🧭 컴퍼스", val: compass, set: setCompass },
          { label: "📋 서판", val: tablet, set: setTablet },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: "#2C1F0E", fontSize: 14 }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => set(Math.max(0, val - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid #E5D5C0", background: "var(--th-bg)", fontSize: 18, cursor: "pointer", fontWeight: 800, color: "var(--th-primary)" }}>−</button>
              <span style={{ fontWeight: 900, fontSize: 20, color: "#2C1F0E", minWidth: 24, textAlign: "center" }}>{val}</span>
              <button onClick={() => set(val + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid var(--th-primary)", background: "var(--th-primary)", fontSize: 18, cursor: "pointer", fontWeight: 800, color: "#fff" }}>+</button>
            </div>
          </div>
        ))}
        <div style={{ background: "var(--th-bg)", borderRadius: 12, padding: "12px 16px", margin: "16px 0", border: "2px solid var(--th-primary)", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#8B7355", marginBottom: 4 }}>{gear}² + {compass}² + {tablet}² + {Math.min(gear, compass, tablet)} × 7</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--th-primary)" }}>{`${score}${t('scoreSheet', 'pts')}`}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "2px solid #E5D5C0", background: "#fff", color: "#8B7355", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>{t('common', 'cancel')}</button>
          <button onClick={() => onConfirm(score)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--th-primary)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>{t('scoreSheet', 'apply')}</button>
        </div>
      </div>
    </div>
  );
};

const ScoreCell = ({ cat, memberId, value, onChange, onOpenScience, readOnly = false }) => {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const stateRef = useRef({ value, onChange, cat, memberId });
  useEffect(() => { stateRef.current = { value, onChange, cat, memberId }; });

  const commitEdit = () => {
    const { onChange: oc, cat: c, memberId: mid } = stateRef.current;
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed)) {
      const min = c.allowNegative ? -50 : 0;
      const clamped = Math.min(50, Math.max(min, parsed));
      oc(c.key, mid, clamped);
    }
    setEditing(false);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (cat.special === "science_7wonders") {
    return (
      <button onClick={readOnly ? undefined : () => onOpenScience(memberId)} style={{
        width: 52, height: 44, borderRadius: 8,
        border: `2px solid ${value ? "#16a34a" : "#E5D5C0"}`,
        background: value ? "#f0fdf4" : "var(--th-bg)",
        color: value ? "#16a34a" : "#A08060",
        fontWeight: 800, fontSize: 13, cursor: readOnly ? "default" : "pointer"
      }}>
        {value || "🧪"}
      </button>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern={cat.allowNegative ? "[-0-9]*" : "[0-9]*"}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.target.blur(); }
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          width: 52, height: 44, borderRadius: 8,
          border: `2px solid ${cat.color}`,
          boxShadow: `0 0 0 2px ${cat.color}44`,
          background: "var(--th-bg)", fontSize: 15, fontWeight: 800,
          color: "var(--th-text)", textAlign: "center",
          outline: "none", padding: 0,
        }}
      />
    );
  }

  return (
    <div
      onClick={readOnly ? undefined : () => { setInputVal(String(value || 0)); setEditing(true); }}
      style={{
        width: 52, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8,
        border: `2px solid #E5D5C0`,
        background: "var(--th-bg)", fontSize: 15, fontWeight: 800,
        color: (cat.negative && value > 0) || (cat.allowNegative && value < 0) ? "#ef4444" : (value > 0 ? "var(--th-text)" : "#A08060"),
        userSelect: "none", cursor: readOnly ? "default" : "pointer", margin: "0 auto",
        transition: "border-color 0.15s",
      }}
    >
      {value || 0}
    </div>
  );
};

export default ScoreCell;
