import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { closeAdminStore, createAdminStore, updateAdminStore, uploadAdminImage } from '../../api/services/admin';
import { REGION_NAMES, REGION_TIMEZONE } from '../../constants/regions';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import AdminSubPage, { AdminPopup } from './AdminSubPage';
import { CameraIcon } from '../store/StoreIcons';

const EMPTY = { name: '', branch: '', address: '', region: 'South Korea', phone: '', imageUrl: '', openTime: '14:00', closeTime: '02:00' };

const sectionStyle = {
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
  padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px',
};
const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 700, color: V('--th-text'), minWidth: 0, flex: 1 };
const inputStyle = {
  height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', width: '100%',
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), outline: 'none',
  fontSize: '15px', fontWeight: 400, color: V('--th-text'),
};
const tileStyle = {
  width: 88, height: 88, boxSizing: 'border-box', borderRadius: '12px', flexShrink: 0,
};

// 예: South Korea (Seoul, UTC+9)
const regionLabel = (region) => {
  const tz = REGION_TIMEZONE[region];
  const city = tz.split('/').pop().replace(/_/g, ' ');
  let offset = '';
  try {
    offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value.replace('GMT', 'UTC') ?? '';
  } catch { /* 오래된 브라우저 */ }
  return `${region} (${city}${offset ? `, ${offset === 'UTC' ? 'UTC+0' : offset}` : ''})`;
};

/**
 * 6e 매장 등록 · 6f 매장 정보 수정 (전체 화면). 영업시간은 저장하면 바로 적용된다 (24차).
 * 운영 끝내기(6f)는 1단계에선 closed_at만 남긴다 (그룹·대회·기기 정리는 각 단계에서).
 * 시안의 주소 "검색" 버튼은 주소 검색 API를 붙일 때 더한다.
 */
const AdminStoreForm = ({ item, onBack, onSaved, onClosed, onAssignStaff }) => {
  const { t } = useLanguage();
  const store = item?.store ?? null;
  const [form, setForm] = useState(() => (store ? {
    name: store.name, branch: store.branch ?? '', address: store.address, region: store.region,
    phone: store.phone ?? '', imageUrl: store.imageUrl ?? '', openTime: store.openTime, closeTime: store.closeTime,
  } : EMPTY));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [closing, setClosing] = useState(false);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.region || !form.openTime || !form.closeTime) {
      setError(t('admin', 'storeRequired'));
      return;
    }
    if (form.openTime === form.closeTime) {
      setError(t('admin', 'sameHours'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const imageUrl = imageFile ? await uploadAdminImage(imageFile) : form.imageUrl;
      const payload = {
        ...form,
        name: form.name.trim(),
        branch: form.branch.trim() || null,
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        imageUrl: imageUrl || null,
      };
      const result = store ? await updateAdminStore(store.id, payload) : await createAdminStore(payload);
      onSaved(result);
      setSaved(result);
    } catch (e) {
      setError(e?.response?.data?.message || t('admin', 'saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setError('');
    try {
      await closeAdminStore(store.id);
      onClosed();
    } catch (e) {
      setClosing(false);
      setError(e?.response?.data?.message || t('admin', 'saveFailed'));
    }
  };

  const photo = imagePreview || form.imageUrl;

  return (
    <AdminSubPage
      title={t('admin', store ? 'editStoreTitle' : 'addStoreTitle')}
      info={t('admin', store ? 'editStoreInfo' : 'addStoreInfo')}
      onBack={onBack}
      t={t}
    >
      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('admin', 'storeBasics')}</h2>
        <label style={labelStyle}>{t('admin', 'storeName')}
          <input style={inputStyle} placeholder={t('admin', 'storeNamePh')} value={form.name} onChange={set('name')} maxLength={60} />
        </label>
        <label style={labelStyle}>{t('admin', 'storeBranch')}
          <input style={inputStyle} placeholder={t('admin', 'storeBranchPh')} value={form.branch} onChange={set('branch')} maxLength={60} />
        </label>
        <label style={labelStyle}>{t('admin', 'storeAddress')}
          <input style={inputStyle} placeholder={t('admin', 'storeAddressPh')} value={form.address} onChange={set('address')} maxLength={200} />
        </label>
        <label style={labelStyle}>{t('admin', 'storeRegion')}
          <select style={{ ...inputStyle, padding: '0 12px' }} value={form.region} onChange={set('region')}>
            {REGION_NAMES.map(r => <option key={r} value={r}>{regionLabel(r)}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={labelStyle}>{t('admin', 'openTime')}
            <input type="time" style={inputStyle} value={form.openTime} onChange={set('openTime')} />
          </label>
          <label style={labelStyle}>{t('admin', 'closeTime')}
            <input type="time" style={inputStyle} value={form.closeTime} onChange={set('closeTime')} />
          </label>
        </div>
        {store && (
          <span style={{ marginTop: -6, fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('admin', 'hoursHint')}</span>
        )}
        <label style={labelStyle}>{t('admin', 'storePhone')}
          <input type="tel" style={inputStyle} placeholder="02-000-0000" value={form.phone} onChange={set('phone')} maxLength={30} />
        </label>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('admin', 'storeImage')}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {photo && (
            <span style={{ ...tileStyle, position: 'relative', backgroundColor: V('--th-bg-deep') }}>
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
              <button
                onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); setImageFile(null); setImagePreview(''); }}
                aria-label={t('admin', 'removeImage')}
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(17,24,39,0.7)', color: '#fff', fontSize: '11px' }}
              >
                ✕
              </button>
            </span>
          )}
          {/* 사진은 한 장 — 있을 때 추가하면 바꾼다 */}
          <label style={{
            ...tileStyle, cursor: 'pointer', border: '1px dashed #D1D5DB', backgroundColor: V('--th-bg'), color: V('--th-text-sub'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px',
          }}>
            <CameraIcon size={20} />
            {t('admin', 'addPhoto')}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </label>
        </div>
      </section>

      {error && <p style={{ margin: 0, fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          height: 52, border: 'none', borderRadius: '14px', cursor: saving ? 'not-allowed' : 'pointer',
          backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700, opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? t('admin', 'saving') : t('admin', store ? 'save' : 'addStoreSubmit')}
      </button>
      {store && !store.closed && (
        <button
          onClick={() => setClosing(true)}
          style={{
            height: 48, borderRadius: '14px', cursor: 'pointer', border: '1px solid #FECACA',
            backgroundColor: V('--th-card'), color: '#DC2626', fontSize: '15px', fontWeight: 700,
          }}
        >
          {t('admin', 'closeStore')}
        </button>
      )}

      {saved && !store && (
        <AdminPopup
          title={t('admin', 'storeCreatedTitle')}
          actions={[
            { label: t('admin', 'assignStaffTitle'), onClick: () => onAssignStaff(saved) },
            { label: t('admin', 'backToAdmin'), onClick: onBack, kind: 'ghost' },
          ]}
        >
          {t('admin', 'storeCreatedDesc')}
        </AdminPopup>
      )}
      {saved && store && (
        <AdminPopup
          title={t('admin', 'storeSavedTitle')}
          actions={[{ label: t('admin', 'backToAdmin'), onClick: onBack }]}
        >
          {t('admin', 'storeSavedDesc')}
        </AdminPopup>
      )}
      {closing && (
        <AdminPopup
          title={t('admin', 'closeStoreTitle').replace('{name}', storeTitle(store))}
          onDismiss={() => setClosing(false)}
          actions={[
            { label: t('admin', 'closeStoreConfirmButton'), onClick: handleClose, kind: 'danger' },
            { label: t('common', 'cancel'), onClick: () => setClosing(false), kind: 'ghost' },
          ]}
        >
          {t('admin', 'closeStoreDesc').replace('{n}', item.memberCount)}
        </AdminPopup>
      )}
    </AdminSubPage>
  );
};

export default AdminStoreForm;
