import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, X } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import PlanComparisonTable from '../components/shared/PlanComparisonTable';
import { useSubscription } from '../hooks/useSubscription';
import { BILLING, PLANS, addMonths, formatDate, formatPrice } from '../constants/subscription';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// 커스텀 점수판은 3개 한도가 생겨 비교표로 옮겼다 — 여기는 진짜 무제한인 것만 남긴다
const FREE_KEYS = ['freeScoring', 'freeHistory', 'freeSeason'];

/**
 * 모임장 Pro 구독 안내. **결제 로직 없음 — 목업이다.**
 * "구독 시작"을 누르면 로컬에만 기록되고 구독 관리 화면이 살아난다.
 */
const Subscription = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { active, subscription, subscribe } = useSubscription();

  const [billing, setBilling] = useState(subscription?.billing ?? BILLING.MONTHLY);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const plan = PLANS[billing];
  const isCurrentPlan = active && subscription?.billing === billing;

  const handleConfirm = () => {
    subscribe(billing);
    setConfirming(false);
    setDone(true);
  };

  /* ── 구독 완료 ───────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: V('--th-bg'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{ maxWidth: 350, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%', margin: '0 auto 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          }}>
            <Check size={38} color="#fff" strokeWidth={3} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: V('--th-text'), margin: '0 0 10px' }}>
            {t('subscription', 'doneTitle')}
          </h2>
          <p style={{ fontSize: 14, color: V('--th-text-sub'), margin: '0 0 30px', lineHeight: 1.6 }}>
            {t('subscription', 'doneDesc')}
          </p>
          <button
            onClick={() => navigate('/subscription/manage')}
            style={{
              width: '100%', padding: '15px', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 10,
            }}
          >
            {t('subscription', 'doneManage')}
          </button>
          <button
            onClick={() => navigate('/lobby')}
            style={{
              width: '100%', padding: '15px', borderRadius: 50, cursor: 'pointer',
              backgroundColor: V('--th-btn-ghost-bg'), border: `1px solid var(--th-btn-ghost-border)`,
              color: V('--th-btn-ghost-text'), fontSize: 15, fontWeight: 700,
            }}
          >
            {t('subscription', 'doneHome')}
          </button>
          <p style={{ margin: '18px 0 0', fontSize: 11, color: V('--th-text-sub') }}>
            {t('subscription', 'prototypeNotice')}
          </p>
        </div>
      </div>
    );
  }

  /* ── 플랜 안내 ───────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)`,
      }}>
        <div style={{
          maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 20px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={22} color="var(--th-primary)" />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--th-primary)' }}>
              {t('subscription', 'title')}
            </span>
          </button>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '28px 20px 150px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          }}>
            <Crown size={28} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: V('--th-text'),
            margin: '0 0 10px', lineHeight: 1.35, whiteSpace: 'pre-line',
          }}>
            {t('subscription', 'headline')}
          </h1>
          <p style={{ fontSize: 14, color: V('--th-text-sub'), margin: 0, lineHeight: 1.6 }}>
            {t('subscription', 'subtitle')}
          </p>
        </div>

        {/* 월간 / 연간 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[BILLING.MONTHLY, BILLING.YEARLY].map((key) => {
            const selected = billing === key;
            const p = PLANS[key];
            const yearly = key === BILLING.YEARLY;
            return (
              <button
                key={key}
                onClick={() => setBilling(key)}
                style={{
                  flex: 1, position: 'relative', cursor: 'pointer', textAlign: 'left',
                  padding: '16px 14px', borderRadius: 16,
                  backgroundColor: selected ? 'rgba(var(--th-primary-rgb), 0.08)' : V('--th-card'),
                  border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                }}
              >
                {yearly && (
                  <span style={{
                    position: 'absolute', top: -9, right: 10,
                    padding: '3px 8px', borderRadius: 999,
                    background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                    color: '#fff', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap',
                  }}>
                    {t('subscription', 'yearlyBadge')}
                  </span>
                )}
                <p style={{
                  margin: '0 0 6px', fontSize: 12, fontWeight: 700,
                  color: selected ? V('--th-primary') : V('--th-text-sub'),
                }}>
                  {t('subscription', yearly ? 'yearly' : 'monthly')}
                </p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: V('--th-text'), lineHeight: 1.25 }}>
                  {formatPrice(p.price, lang)}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: V('--th-text-sub') }}>
                  {yearly
                    ? fill(t('subscription', 'yearlyPerMonth'), { price: formatPrice(p.perMonth, lang) })
                    : t('subscription', 'perMonth')}
                </p>
              </button>
            );
          })}
        </div>

        {/* 무료/Pro 비교. 숫자를 그대로 보여준다 */}
        <p style={{ fontSize: 13, fontWeight: 700, color: V('--th-text'), margin: '0 0 12px' }}>
          {t('subscription', 'featuresTitle')}
        </p>
        <div style={{ marginBottom: 24 }}>
          <PlanComparisonTable />
        </div>

        {/* 안 잠기는 것. 잠기는 것보다 이쪽이 더 중요하다 (문서 A-7) */}
        <p style={{ fontSize: 13, fontWeight: 700, color: V('--th-text'), margin: '0 0 12px' }}>
          {t('subscription', 'freeTitle')}
        </p>
        <div style={{
          borderRadius: 18, border: `1px dashed var(--th-border)`,
          padding: '16px', backgroundColor: 'transparent',
        }}>
          {FREE_KEYS.map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
              <span style={{ color: V('--th-text-sub'), fontSize: 13, lineHeight: 1.5 }}>·</span>
              <span style={{ fontSize: 13, color: V('--th-text-sub'), lineHeight: 1.5 }}>
                {t('subscription', key)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        backgroundColor: V('--th-nav-bg'), borderTop: `1px solid var(--th-border)`,
        padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 390, margin: '0 auto' }}>
          <button
            onClick={() => setConfirming(true)}
            disabled={isCurrentPlan}
            style={{
              width: '100%', padding: '16px', borderRadius: 50, border: 'none',
              cursor: isCurrentPlan ? 'default' : 'pointer',
              background: isCurrentPlan ? V('--th-bg-deep') : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: isCurrentPlan ? V('--th-text-sub') : '#fff',
              fontSize: 16, fontWeight: 700,
            }}
          >
            {isCurrentPlan
              ? t('subscription', 'currentPlan')
              : active
                ? t('subscription', 'changePlan')
                : t('subscription', 'subscribeCta')}
          </button>
          <p style={{ margin: '9px 0 0', fontSize: 11, color: V('--th-text-sub'), textAlign: 'center' }}>
            {t('subscription', 'prototypeNotice')}
          </p>
        </div>
      </div>

      {/* 결제 확인 시트 */}
      {confirming && (
        <div
          onClick={() => setConfirming(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 60,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 390, backgroundColor: V('--th-card'),
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px calc(28px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
              <button
                onClick={() => setConfirming(false)}
                aria-label={t('subscription', 'back')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color="var(--th-text-sub)" />
              </button>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, color: V('--th-text'), margin: '0 0 18px' }}>
              {t('subscription', 'confirmTitle')}
            </h3>

            <div style={{
              backgroundColor: V('--th-bg'), borderRadius: 16,
              border: `1px solid var(--th-border)`, padding: '16px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: V('--th-text') }}>
                  {t('subscription', billing === BILLING.YEARLY ? 'confirmPlanYearly' : 'confirmPlanMonthly')}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: V('--th-primary') }}>
                  {formatPrice(plan.price, lang)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: V('--th-text-sub'), lineHeight: 1.6 }}>
                {fill(t('subscription', 'confirmBillingDate'), {
                  date: formatDate(addMonths(new Date().toISOString(), plan.months), lang),
                })}
                <br />
                {t('subscription', 'confirmRenewal')}
              </p>
            </div>

            <p style={{ margin: '0 0 18px', fontSize: 12, color: V('--th-text-sub'), lineHeight: 1.6, textAlign: 'center' }}>
              {t('subscription', 'confirmCancelAnytime')}
            </p>

            <button
              onClick={handleConfirm}
              style={{
                width: '100%', padding: '16px', borderRadius: 50, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: 16, fontWeight: 700,
              }}
            >
              {t('subscription', 'confirmCta')}
            </button>
            <p style={{ margin: '11px 0 0', fontSize: 11, color: V('--th-text-sub'), textAlign: 'center' }}>
              {t('subscription', 'prototypeNotice')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
