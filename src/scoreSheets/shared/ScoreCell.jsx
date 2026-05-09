import { useState, useRef, useEffect } from "react";
export { ScienceModal } from './ScienceModal';

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
        border: `2px solid ${value ? "#16a34a" : "var(--th-border)"}`,
        background: value ? "#f0fdf4" : "var(--th-bg)",
        color: value ? "#16a34a" : "var(--th-text-sub)",
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
        border: `2px solid var(--th-border)`,
        background: "var(--th-bg)", fontSize: 15, fontWeight: 800,
        color: (cat.negative && value > 0) || (cat.allowNegative && value < 0) ? "#ef4444" : (value > 0 ? "var(--th-text)" : "var(--th-text-sub)"),
        userSelect: "none", cursor: readOnly ? "default" : "pointer", margin: "0 auto",
        transition: "border-color 0.15s",
      }}
    >
      {value || 0}
    </div>
  );
};

export default ScoreCell;
