import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import SeasonFields from '../shared/SeasonFields';
import { isSeasonInputValid, seasonLabel } from '../../utils/seasonUtils';

/**
 * 호스트 전용 — 진행 중 시즌의 이름·종료일 수정 (plan-season-reset §22).
 * 끝난 시즌은 기록이라 고칠 수 없고, 종료일은 내일 이후만 된다.
 */
const SeasonEditModal = ({ season, region, onClose, onSave, t }) => {
  // 자동 연장된 시즌은 이름이 비어 있다 — 화면에 보이던 "시즌 N"을 그대로 채워 준다.
  const [name, setName] = useState(() => seasonLabel(season, t));
  const [endDate, setEndDate] = useState(season.endDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const valid = isSeasonInputValid(name, endDate, region);

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), endDate });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('season', 'seasonSaveFailed'));
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
      <div style={{ borderRadius: 16, padding: 24, margin: '0 16px', width: '100%', maxWidth: 340, backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: V('--th-text'), margin: '0 0 16px' }}>{t('season', 'editSeason')}</h3>
        <SeasonFields
          name={name}
          setName={setName}
          endDate={endDate}
          setEndDate={setEndDate}
          region={region}
          t={t}
        />
        {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '12px 0 0' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid ${V('--th-border')}`, cursor: 'pointer' }}>
            {t('common', 'cancel')}
          </button>
          <button onClick={handleSave} disabled={!valid || saving} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-primary'), color: '#fff', border: 'none', cursor: valid && !saving ? 'pointer' : 'not-allowed', opacity: !valid || saving ? 0.5 : 1 }}>
            {saving ? t('ranking', 'saving') : t('ranking', 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonEditModal;
