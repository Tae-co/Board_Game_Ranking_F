import { useLanguage } from '../../i18n/LanguageContext';

// 승 → 1티어, 무 → 2티어, 패 → 3티어. 같은 티어끼리 동순위로 묶인다.
export const OUTCOME_TIER = { win: 1, draw: 2, loss: 3 };

const OUTCOME_COLOR = { win: '#16a34a', draw: '#6b7280', loss: '#dc2626' };

/**
 * WinDrawLossTable - 플레이어별로 승/무/패 하나만 고르는 입력 컴포넌트
 * type: 'outcome' 커스텀 점수판에서 사용
 */
const WinDrawLossTable = ({ players, outcomeInputs, onChange, readOnly }) => {
  const { t } = useLanguage();

  const options = [
    { key: 'win', label: t('scoreSheet', 'wins') },
    { key: 'draw', label: t('scoreSheet', 'draw') },
    { key: 'loss', label: t('scoreSheet', 'loss') },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {players.map((player, idx) => {
        const selected = outcomeInputs[player.memberId] || "";
        const isLast = idx === players.length - 1;
        return (
          <div
            key={player.memberId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "12px 16px",
              // 마지막 행에도 밑줄을 그으면 카드 테두리와 겹쳐 선이 두 줄로 보인다
              borderBottom: isLast ? "none" : "1px solid var(--th-border)",
            }}
          >
            <span style={{
              fontSize: 14, fontWeight: 600, color: "var(--th-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {player.nickname}
            </span>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {options.map((opt) => {
                const isOn = selected === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange(player.memberId, isOn ? "" : opt.key)}
                    style={{
                      minWidth: 48,
                      padding: "7px 10px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isOn ? 700 : 500,
                      cursor: readOnly ? "default" : "pointer",
                      backgroundColor: isOn ? OUTCOME_COLOR[opt.key] : "var(--th-bg)",
                      color: isOn ? "#fff" : "var(--th-text-sub)",
                      border: `2px solid ${isOn ? OUTCOME_COLOR[opt.key] : "var(--th-border)"}`,
                      outline: "none",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WinDrawLossTable;
