import { Check, X } from 'lucide-react';
import { PRO_FEATURES } from '../../constants/subscription';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

/**
 * 무료 / Pro 한도 비교표. 페이월 시트와 구독 안내 페이지가 공유한다.
 *
 * 숫자를 말로 뭉개지 않는다 — "참석자 수 무제한"이 아니라 "참석자 8명 → 무제한".
 * 무료로 뭘 얼마나 쓸 수 있는지가 페이월에서 가장 중요한 정보다.
 * 숫자는 전부 FREE_LIMITS에서 온다.
 *
 * @param highlightGate 이 게이트에 해당하는 행을 강조한다 (막힌 지점을 짚어주려고)
 */
const PlanComparisonTable = ({ highlightGate = null }) => {
  const { t } = useLanguage();

  const freeLabel = (f) =>
    f.free == null
      ? null
      : t('subscription', f.unit === 'people' ? 'unitPeople' : 'unitCount')
          .replace('{n}', f.free);

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'),
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 68px 68px',
        padding: '10px 14px', backgroundColor: V('--th-bg'),
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <span />
        <span style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), textAlign: 'center' }}>
          {t('subscription', 'colFree')}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: V('--th-primary'), textAlign: 'center' }}>
          {t('subscription', 'colPro')}
        </span>
      </div>

      {PRO_FEATURES.map((f, i) => {
        const highlighted = f.gate != null && f.gate === highlightGate;
        const free = freeLabel(f);
        return (
          <div
            key={f.key}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 68px 68px', alignItems: 'center',
              padding: '13px 14px',
              borderBottom: i < PRO_FEATURES.length - 1 ? `1px solid var(--th-border)` : 'none',
              backgroundColor: highlighted ? 'rgba(var(--th-primary-rgb), 0.1)' : 'transparent',
            }}
          >
            <span style={{
              fontSize: 13.5,
              fontWeight: highlighted ? 700 : 500,
              color: highlighted ? V('--th-primary') : V('--th-text'),
            }}>
              {t('subscription', `feat_${f.key}`)}
            </span>

            {/* 무료 한도: 숫자가 있으면 숫자로, 없으면 ✕ */}
            <span style={{ textAlign: 'center' }}>
              {free
                ? <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: highlighted ? V('--th-primary') : V('--th-text-sub'),
                  }}>{free}</span>
                : <X size={15} color="var(--th-text-sub)" style={{ verticalAlign: 'middle' }} />}
            </span>

            {/* Pro: 숫자 항목은 무제한, 나머지는 ✓ */}
            <span style={{ textAlign: 'center' }}>
              {free
                ? <span style={{ fontSize: 12, fontWeight: 800, color: V('--th-primary') }}>
                    {t('subscription', 'unlimited')}
                  </span>
                : <Check size={16} color="var(--th-primary)" strokeWidth={3} style={{ verticalAlign: 'middle' }} />}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PlanComparisonTable;
