import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

// =============================================
// 게임별 점수 스키마 정의
// =============================================
const SCORE_SCHEMAS = {
  // 카탄 (board_game_id = 1)
  1: {
    name: "CATAN",
    type: "catan",
    categories: [
      { key: "settlement", label: "정착지", icon: "🏘️", color: "#92400e", multiplier: 1 },
      { key: "cities",     label: "도시",   icon: "🏙️", color: "#1d4ed8", multiplier: 2 },
      { key: "longest_road", label: "최장 도로", icon: "🛤️", color: "#15803d", type: "exclusive_check", bonus: 2 },
      { key: "largest_army", label: "최대 군대", icon: "⚔️", color: "#dc2626", type: "exclusive_check", bonus: 2 },
      { key: "vp_cards",   label: "승점 카드", icon: "🃏", color: "#7c3aed", multiplier: 1 },
    ],
  },

  // 7 Wonders
  2: {
    name: "7WONDERS",
    type: "flat",
    categories: [
      { key: "military",  label: "군사",     icon: "⚔️",  color: "#dc2626" },
      { key: "treasury",  label: "금화",     icon: "💰",  color: "#ca8a04" },
      { key: "wonder",    label: "불가사의", icon: "🏛️",  color: "#78716c" },
      { key: "civilian",  label: "시민",     icon: "🟦",  color: "#2563eb" },
      { key: "commerce",  label: "상업",     icon: "🟡",  color: "#d97706" },
      { key: "guild",     label: "길드",     icon: "🟣",  color: "#7c3aed" },
      { key: "science",   label: "과학",     icon: "🟢",  color: "#16a34a", special: "science_7wonders" },
    ],
  },

  // 캐스캐디아 - 섹션 구조
  3: {
    name: "CASCADIA",
    type: "sectioned",
    sections: [
      {
        key: "animal",
        label: "동물 점수",
        icon: "🐾",
        color: "#065f46",
        bgColor: "#f0fdf4",
        categories: [
          { key: "bear",   label: "곰",   icon: "🐻", color: "#92400e" },
          { key: "elk",    label: "엘크", icon: "🦌", color: "#065f46" },
          { key: "salmon", label: "연어", icon: "🐟", color: "#0369a1" },
          { key: "hawk",   label: "매",   icon: "🦅", color: "#1e40af" },
          { key: "fox",    label: "여우", icon: "🦊", color: "#c2410c" },
        ],
      },
      {
        key: "habitat",
        label: "지형 점수",
        icon: "🗺️",
        color: "#6d28d9",
        bgColor: "#faf5ff",
        categories: [
          { key: "forest",   label: "숲",  icon: "🌲", color: "#15803d" },
          { key: "mountain", label: "산",  icon: "⛰️", color: "#78716c" },
          { key: "river",    label: "강",  icon: "🌊", color: "#0284c7" },
          { key: "prairie",  label: "초원",icon: "🌾", color: "#65a30d" },
          { key: "wetland",  label: "습지",icon: "🌿", color: "#0f766e" },
        ],
      },
      {
        key: "bonus",
        label: "보너스",
        icon: "⭐",
        color: "#b45309",
        bgColor: "#fffbeb",
        categories: [
          { key: "nature",   label: "자연 토큰", icon: "🍃", color: "#15803d" },
          { key: "pinecone", label: "솔방울",    icon: "🌰", color: "#92400e" },
        ],
      },
    ],
  },

  // Azul
  4: {
    name: "AZUL",
    type: "flat",
    categories: [
      { key: "wall",     label: "벽 타일", icon: "🔷", color: "#1d4ed8" },
      { key: "row",      label: "완성 행", icon: "➡️", color: "#0f766e" },
      { key: "col",      label: "완성 열", icon: "⬇️", color: "#7c3aed" },
      { key: "color",    label: "같은 색", icon: "🎨", color: "#b91c1c" },
      { key: "negative", label: "감점",    icon: "❌", color: "#6b7280", negative: true },
    ],
  },
};

const getAllCategories = (schema) => {
  if (schema.type === "sectioned") return schema.sections.flatMap(s => s.categories);
  return schema.categories || [];
};

// =============================================
// 7Wonders 과학 자동 계산 모달
// =============================================
const ScienceModal = ({ onConfirm, onClose }) => {
  const { t } = useLanguage();
  const [gear, setGear] = useState(0);
  const [compass, setCompass] = useState(0);
  const [tablet, setTablet] = useState(0);

  const score = useMemo(() => {
    const sets = Math.min(gear, compass, tablet);
    return gear * gear + compass * compass + tablet * tablet + sets * 7;
  }, [gear, compass, tablet]);

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

// =============================================
// 점수 입력 셀 (player = memberId)
// =============================================
const ScoreCell = ({ cat, memberId, value, onChange, onOpenScience }) => {
  if (cat.special === "science_7wonders") {
    return (
      <button onClick={() => onOpenScience(memberId)} style={{
        width: 40, height: 32, borderRadius: 8,
        border: `2px solid ${value ? "#16a34a" : "#E5D5C0"}`,
        background: value ? "#f0fdf4" : "var(--th-bg)",
        color: value ? "#16a34a" : "#A08060",
        fontWeight: 800, fontSize: 12, cursor: "pointer"
      }}>
        {value || "🧪"}
      </button>
    );
  }
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={e => onChange(cat.key, memberId, e.target.value)}
      style={{
        width: 40, height: 32, textAlign: "center",
        borderRadius: 8, border: "2px solid #E5D5C0",
        background: "var(--th-bg)", fontSize: 13, fontWeight: 700,
        color: cat.negative ? "#ef4444" : "var(--th-text)",
        outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = cat.color}
      onBlur={e => e.target.style.borderColor = "#E5D5C0"}
      placeholder="0"
    />
  );
};

// =============================================
// 합계 행
// =============================================
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

// =============================================
// Flat 테이블 (7Wonders, Azul)
// =============================================
const FlatTable = ({ schema, players, scores, totals, winnerId, handleChange, setScienceModal, t }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 80 }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => (
          <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: p.memberId === winnerId ? "var(--th-primary)" : "#F5E6D0", minWidth: 52 }}>
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
            <span style={{ color: cat.color }}>{cat.label}</span>
            {cat.negative && <span style={{ fontSize: 9, color: "#ef4444", marginLeft: 2 }}>({t('scoreSheet', 'negative')})</span>}
          </td>
          {players.map(p => (
            <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
              <ScoreCell cat={cat} memberId={p.memberId} value={scores[cat.key]?.[p.memberId]} onChange={handleChange} onOpenScience={(id) => setScienceModal({ memberId: id })} />
            </td>
          ))}
        </tr>
      ))}
      <TotalRow players={players} totals={totals} winnerId={winnerId} t={t} />
    </tbody>
  </table>
);

// =============================================
// Sectioned 테이블 (캐스캐디아)
// =============================================
const SectionedTable = ({ schema, players, scores, totals, winnerId, handleChange, t }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 80 }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => (
          <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: p.memberId === winnerId ? "var(--th-primary)" : "#F5E6D0", minWidth: 52 }}>
            {p.memberId === winnerId ? "👑 " : ""}{p.nickname}
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
                borderTop: `3px solid ${section.color}`,
                letterSpacing: "0.05em"
              }}>
                {section.icon} {section.label}
              </td>
            </tr>
            {section.categories.map((cat, idx) => (
              <tr key={cat.key} style={{ background: idx % 2 === 0 ? "var(--th-card)" : section.bgColor + "55" }}>
                <td style={{ padding: "7px 4px 7px 16px", fontSize: 11, fontWeight: 700, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
                  <span style={{ marginRight: 3 }}>{cat.icon}</span>
                  <span style={{ color: cat.color }}>{cat.label}</span>
                </td>
                {players.map(p => (
                  <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
                    <ScoreCell cat={cat} memberId={p.memberId} value={scores[cat.key]?.[p.memberId]} onChange={handleChange} onOpenScience={() => {}} />
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

// =============================================
// 카탄 전용 테이블
// =============================================
const CatanTable = ({ schema, players, scores, totals, handleChange, handleCatanCheck, t }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 80 }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => {
          const total = totals[p.memberId] ?? 0;
          const canWin = total >= 10;
          return (
            <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: canWin ? "var(--th-primary)" : "#F5E6D0", minWidth: 52 }}>
              {canWin ? "👑 " : ""}{p.nickname}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {schema.categories.map((cat, idx) => (
        <tr key={cat.key} style={{ background: idx % 2 === 0 ? "var(--th-card)" : "var(--th-bg)" }}>
          <td style={{ padding: "8px 4px 8px 8px", fontSize: 11, fontWeight: 700, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
            <span style={{ marginRight: 3 }}>{cat.icon}</span>
            <span style={{ color: cat.color }}>{cat.label}</span>
            {cat.type === "exclusive_check" && (
              <span style={{ fontSize: 9, color: cat.color, marginLeft: 3 }}>+{cat.bonus}점</span>
            )}
          </td>
          {players.map(p => (
            <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
              {cat.type === "exclusive_check" ? (
                <button
                  onClick={() => handleCatanCheck(cat.key, p.memberId)}
                  style={{
                    width: 40, height: 32, borderRadius: 8, cursor: "pointer",
                    border: `2px solid ${scores[cat.key]?.[p.memberId] ? cat.color : "#E5D5C0"}`,
                    background: scores[cat.key]?.[p.memberId] ? cat.color + "22" : "var(--th-bg)",
                    color: scores[cat.key]?.[p.memberId] ? cat.color : "#A08060",
                    fontWeight: 900, fontSize: 14,
                  }}
                >
                  {scores[cat.key]?.[p.memberId] ? "✓" : "—"}
                </button>
              ) : (
                <input
                  type="number"
                  value={scores[cat.key]?.[p.memberId] ?? ""}
                  onChange={e => handleChange(cat.key, p.memberId, e.target.value)}
                  style={{
                    width: 40, height: 32, textAlign: "center",
                    borderRadius: 8, border: "2px solid #E5D5C0",
                    background: "var(--th-bg)", fontSize: 13, fontWeight: 700,
                    color: "var(--th-text)", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = cat.color}
                  onBlur={e => e.target.style.borderColor = "#E5D5C0"}
                  placeholder="0"
                />
              )}
            </td>
          ))}
        </tr>
      ))}
      {/* 합계 행 */}
      <tr style={{ background: "#2C1F0E" }}>
        <td style={{ padding: "10px 8px", fontWeight: 900, color: "var(--th-primary)", fontSize: 13 }}>{t('scoreSheet', 'total')}</td>
        {players.map(p => {
          const total = totals[p.memberId] ?? 0;
          const canWin = total >= 10;
          return (
            <td key={p.memberId} style={{ padding: "10px 4px", textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: canWin ? "var(--th-primary)" : "#F5E6D0" }}>{total}</div>
              {canWin && <div style={{ fontSize: 9, color: "var(--th-primary)", fontWeight: 700, marginTop: 2 }}>🏆 {t('scoreSheet', 'canWin')}</div>}
            </td>
          );
        })}
      </tr>
    </tbody>
  </table>
);

// =============================================
// 메인 컴포넌트
// =============================================
const ScoreSheet = () => {
  const { boardGameId: boardGameIdStr } = useParams();
  const boardGameId = Number(boardGameIdStr);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { players = [], roomId, gameName = '', editMatchId = null, savedScores = null } = location.state || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scienceModal, setScienceModal] = useState(null);

  // DB ID가 스키마 키와 다를 수 있으므로 게임 이름으로 우선 조회, 없으면 ID로 fallback
  const currentSchema = Object.values(SCORE_SCHEMAS).find(s =>
    gameName && (gameName.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(gameName.toLowerCase()))
  ) ?? SCORE_SCHEMAS[boardGameId];

  const initScores = (schema, playerList) => {
    const cats = getAllCategories(schema);
    const init = {};
    cats.forEach(cat => {
      init[cat.key] = {};
      playerList.forEach(p => { init[cat.key][p.memberId] = cat.type === 'exclusive_check' ? false : ""; });
    });
    return init;
  };

  const handleCatanCheck = (catKey, memberId) => {
    setScores(prev => {
      const wasChecked = prev[catKey]?.[memberId];
      const newChecks = {};
      players.forEach(p => { newChecks[p.memberId] = p.memberId === memberId ? !wasChecked : false; });
      return { ...prev, [catKey]: newChecks };
    });
  };

  const [scores, setScores] = useState(() => {
    if (!currentSchema) return {};
    if (savedScores) return savedScores;
    return initScores(currentSchema, players);
  });

  const allCategories = currentSchema ? getAllCategories(currentSchema) : [];

  const handleChange = (catKey, memberId, value) => {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [memberId]: value } }));
  };

  const totals = useMemo(() => {
    const t = {};
    players.forEach(p => {
      if (currentSchema?.type === 'catan') {
        t[p.memberId] = currentSchema.categories.reduce((sum, cat) => {
          const v = scores[cat.key]?.[p.memberId];
          if (cat.type === 'exclusive_check') return sum + (v ? cat.bonus : 0);
          return sum + (Number(v) || 0) * (cat.multiplier || 1);
        }, 0);
      } else {
        t[p.memberId] = allCategories.reduce((sum, cat) => {
          const v = Number(scores[cat.key]?.[p.memberId]) || 0;
          return cat.negative ? sum - Math.abs(v) : sum + v;
        }, 0);
      }
    });
    return t;
  }, [scores, players, allCategories, currentSchema]);

  const winnerId = useMemo(() =>
    players.reduce((a, b) => (totals[a.memberId] ?? 0) >= (totals[b.memberId] ?? 0) ? a : b, players[0])?.memberId
  , [totals, players]);

  const calcPlacements = () => {
    const entries = players.map(p => ({ memberId: p.memberId, score: totals[p.memberId] }));
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const placements = {};
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
      } else {
        placements[sorted[i].memberId] = currentRank;
      }
      currentRank++;
    }
    return placements;
  };

  const handleSubmit = async () => {
    const placements = calcPlacements();
    const allCats = getAllCategories(currentSchema);
    const participants = players.map(p => ({
      memberId: p.memberId,
      placement: placements[p.memberId],
      scoresJson: JSON.stringify(
        Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId]]))
      ),
    }));
    try {
      setIsSubmitting(true);
      const res = editMatchId
        ? await api.put(`/matches/${editMatchId}`, { boardGameId, roomId, participants })
        : await api.post('/matches', { boardGameId, roomId, participants });
      navigate(`/ranking/${roomId}`, { state: { matchResult: res.data }, replace: true });
    } catch (err) {
      alert(t('scoreSheet', 'saveFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentSchema || !players.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--th-bg)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
        <p style={{ color: "var(--th-text-sub)", marginBottom: 24 }}>{t('scoreSheet', 'wrongAccess')}</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-primary)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 700 }}
        >
          {t('scoreSheet', 'goBack')}
        </button>
      </div>
    );
  }

  const winnerNickname = players.find(p => p.memberId === winnerId)?.nickname;

  return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", background: "var(--th-bg)", minHeight: "100vh", paddingBottom: 100, maxWidth: '375px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--th-bg)", padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--th-primary)" }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--th-text)" }}>{`${currentSchema.name} ${t('scoreSheet', 'scoreBoard')}`}</h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--th-text-sub)" }}>{t('scoreSheet', 'enterScores')}</p>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ margin: "0 16px", background: "var(--th-card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--th-border)" }}>
        <div style={{ overflowX: "auto" }}>
          {currentSchema.type === "catan" ? (
            <CatanTable schema={currentSchema} players={players} scores={scores} totals={totals} handleChange={handleChange} handleCatanCheck={handleCatanCheck} t={t} />
          ) : currentSchema.type === "sectioned" ? (
            <SectionedTable schema={currentSchema} players={players} scores={scores} totals={totals} winnerId={winnerId} handleChange={handleChange} t={t} />
          ) : (
            <FlatTable schema={currentSchema} players={players} scores={scores} totals={totals} winnerId={winnerId} handleChange={handleChange} setScienceModal={setScienceModal} t={t} />
          )}
        </div>
      </div>

      {/* 우승자 배너 */}
      {Object.values(totals).some(v => v > 0) && (
        <div style={{ margin: "16px 16px 0", background: "var(--th-primary)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <span style={{ fontSize: 28 }}>👑</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>{`${winnerNickname} ${t('scoreSheet', 'victory')}`}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{`${totals[winnerId]}${t('scoreSheet', 'firstPlace')}`}</div>
          </div>
        </div>
      )}

      {/* Bottom Fixed Button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 16, background: "var(--th-bg)", maxWidth: 375, margin: "0 auto" }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 50, border: "none",
            background: isSubmitting ? "var(--th-border)" : "var(--th-primary)",
            color: "#fff", fontSize: 14, fontWeight: 900, cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? t('scoreSheet', 'saving') : editMatchId ? t('scoreSheet', 'submitEdit') : t('scoreSheet', 'submit')}
        </button>
      </div>

      {/* 과학 모달 */}
      {scienceModal && (
        <ScienceModal
          onConfirm={(score) => { handleChange("science", scienceModal.memberId, score); setScienceModal(null); }}
          onClose={() => setScienceModal(null)}
        />
      )}
    </div>
  );
};

export default ScoreSheet;
