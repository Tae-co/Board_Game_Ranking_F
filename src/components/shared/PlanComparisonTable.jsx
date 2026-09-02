import { Check, X } from 'lucide-react';
import { PRO_FEATURES } from '../../constants/subscription';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

/**
 * 무료 / Pro 한도 비교표. 페이월 시트와 구독 안내 페이지가 공유한다.
 *
 * 숫자를 말로 뭉개지 않는다 — "참석자 수 무제한"이 아니라 "참석자 | 8명 | 무제한".
 * 무료로 뭘 얼마나 쓸 수 있는지가 페이월에서 가장 중요한 정보다.
 * 숫자는 전부 FREE_LIMITS에서 온다.
 *
 * 열 정렬: 값 칸을 고정 px가 아니라 비율(fr)로 잡아 라벨과 값이 멀어지지 않게 하고,
 * Pro 칸에 배경을 깔아 표 오른쪽 끝까지 이어지는 하나의 '열'로 보이게 한다.
 * 그래서 가로 여백은 grid가 아니라 각 칸이 직접 갖는다.
 *
 * @param highlightGate 이 게이트에 해당하는 행을 강조한다 (막힌 지점을 짚어주려고)
 */
const COLS = '1.5fr 1fr 1fr';
const PRO_TINT = 'rgba(var(--th-primary-rgb), 0.07)';
const PAD_X = 14;

const PlanComparisonTable = ({ highlightGate = null }) => {
  const { t } = useLanguage();

  const freeLabel = (f) =>
    f.free == null
      ? null
      : t('subscription', f.unit === 'people' ? 'unitPeople' : 'unitCount')
          .replace('{n}', f.free);

  const cell = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'),
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: COLS,
        backgroundColor: V('--th-bg'), borderBottom: `1px solid var(--th-border)`,
      }}>
        <span />
        <span style={{
          ...cell, padding: '9px 4px',
          fontSize: 11, fontWeight: 700, color: V('--th-text-sub'),
        }}>
          {t('subscription', 'colFree')}
        </span>
        <span style={{
          ...cell, padding: '9px 4px', backgroundColor: PRO_TINT,
          fontSize: 11, fontWeight: 800, color: V('--th-primary'),
        }}>
          {t('subscription', 'colPro')}
        </span>
      </div>

      {PRO_FEATURES.map((f, i) => {
        const highlighted = f.gate != null && f.gate === highlightGate;
        const free = freeLabel(f);
        const border = i < PRO_FEATURES.length - 1 ? `1px solid var(--th-border)` : 'none';
        return (
          <div
            key={f.key}
            style={{
              display: 'grid', gridTemplateColumns: COLS, alignItems: 'stretch',
              backgroundColor: highlighted ? 'rgba(var(--th-primary-rgb), 0.12)' : 'transparent',
            }}
          >
            <span style={{
              display: 'flex', alignItems: 'center',
              padding: `12px ${PAD_X}px`, borderBottom: border,
              fontSize: 13.5, lineHeight: 1.3,
              fontWeight: highlighted ? 700 : 500,
              color: highlighted ? V('--th-primary') : V('--th-text'),
            }}>
              {t('subscription', `feat_${f.key}`)}
            </span>

            {/* 무료 한도: 숫자가 있으면 숫자로, 없으면 ✕ */}
            <span style={{ ...cell, padding: '12px 4px', borderBottom: border }}>
              {free
                ? <span style={{
                    fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: highlighted ? V('--th-primary') : V('--th-text-sub'),
                  }}>{free}</span>
                : <X size={15} color="var(--th-text-sub)" />}
            </span>

            {/* Pro: 숫자 항목은 무제한, 나머지는 ✓ */}
            <span style={{
              ...cell, padding: '12px 4px', borderBottom: border,
              backgroundColor: highlighted ? 'transparent' : PRO_TINT,
            }}>
              {free
                ? <span style={{ fontSize: 11.5, fontWeight: 800, color: V('--th-primary'), textAlign: 'center' }}>
                    {t('subscription', 'unlimited')}
                  </span>
                : <Check size={16} color="var(--th-primary)" strokeWidth={3} />}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PlanComparisonTable;
