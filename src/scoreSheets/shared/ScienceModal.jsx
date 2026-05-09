import { useState } from "react";
import { useLanguage } from '../../i18n/LanguageContext';

export const ScienceModal = ({ onConfirm, onClose }) => {
  const { t } = useLanguage();
  const [gear, setGear] = useState(0);
  const [compass, setCompass] = useState(0);
  const [tablet, setTablet] = useState(0);
  const score = gear * gear + compass * compass + tablet * tablet + Math.min(gear, compass, tablet) * 7;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--th-card)", borderRadius: 20, padding: 28, width: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: "0 0 4px", color: "var(--th-text)", fontSize: 18, fontWeight: 800 }}>{`🟢 ${t('scoreSheet', 'scienceTitle')}`}</h3>
        <p style={{ margin: "0 0 20px", color: "var(--th-text-sub)", fontSize: 12 }}>{t('scoreSheet', 'scienceDesc')}</p>
        {[
          { label: "⚙️ 기어", val: gear, set: setGear },
          { label: "🧭 컴퍼스", val: compass, set: setCompass },
          { label: "📋 서판", val: tablet, set: setTablet },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: "var(--th-text)", fontSize: 14 }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => set(Math.max(0, val - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid var(--th-border)", background: "var(--th-bg)", fontSize: 18, cursor: "pointer", fontWeight: 800, color: "var(--th-primary)" }}>−</button>
              <span style={{ fontWeight: 900, fontSize: 20, color: "var(--th-text)", minWidth: 24, textAlign: "center" }}>{val}</span>
              <button onClick={() => set(val + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid var(--th-primary)", background: "var(--th-primary)", fontSize: 18, cursor: "pointer", fontWeight: 800, color: "#fff" }}>+</button>
            </div>
          </div>
        ))}
        <div style={{ background: "var(--th-bg)", borderRadius: 12, padding: "12px 16px", margin: "16px 0", border: "2px solid var(--th-primary)", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--th-text-sub)", marginBottom: 4 }}>{gear}² + {compass}² + {tablet}² + {Math.min(gear, compass, tablet)} × 7</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--th-primary)" }}>{`${score}${t('scoreSheet', 'pts')}`}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "2px solid var(--th-border)", background: "var(--th-bg)", color: "var(--th-text-sub)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>{t('common', 'cancel')}</button>
          <button onClick={() => onConfirm(score)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "var(--th-primary)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>{t('scoreSheet', 'apply')}</button>
        </div>
      </div>
    </div>
  );
};

export default ScienceModal;
