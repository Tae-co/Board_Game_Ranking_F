import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { createAdminStore, updateAdminStore, uploadAdminImage } from '../../api/services/admin';
import { REGION_NAMES } from '../../constants/regions';
import { V } from '../../utils/cssUtils';

const EMPTY = { name: '', branch: '', address: '', region: 'South Korea', phone: '', imageUrl: '', openTime: '14:00', closeTime: '02:00' };

const inputStyle = {
  backgroundColor: V('--th-bg'),
  borderColor: V('--th-border'),
  color: V('--th-text'),
};

/** 6e 매장 등록 · 6f 수정. 영업시간은 저장하면 바로 적용된다 (24차) */
const AdminStoreForm = ({ store, onSaved, onCancel }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => (store ? {
    name: store.name, branch: store.branch ?? '', address: store.address, region: store.region,
    phone: store.phone ?? '', imageUrl: store.imageUrl ?? '', openTime: store.openTime, closeTime: store.closeTime,
  } : EMPTY));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      const saved = store ? await updateAdminStore(store.id, payload) : await createAdminStore(payload);
      onSaved(saved);
    } catch (e) {
      setError(e?.response?.data?.message || t('admin', 'saveFailed'));
      setSaving(false);
    }
  };

  const field = 'w-full px-4 py-3 rounded-lg border focus:outline-none';

  return (
    <div className="rounded-2xl p-5 mb-5 border shadow-sm" style={{ backgroundColor: V('--th-card'), borderColor: V('--th-border') }}>
      <p className="mb-4" style={{ color: V('--th-text') }}>{store ? t('admin', 'editStoreTitle') : t('admin', 'addStoreTitle')}</p>
      <div className="space-y-3">
        <input type="text" placeholder={t('admin', 'storeName')} className={field} style={inputStyle} value={form.name} onChange={set('name')} maxLength={60} />
        <input type="text" placeholder={t('admin', 'storeBranch')} className={field} style={inputStyle} value={form.branch} onChange={set('branch')} maxLength={60} />
        <input type="text" placeholder={t('admin', 'storeAddress')} className={field} style={inputStyle} value={form.address} onChange={set('address')} maxLength={200} />
        <div>
          <label className="block mb-1.5 text-xs" style={{ color: V('--th-text-sub') }}>{t('admin', 'storeRegion')}</label>
          <select className={field} style={inputStyle} value={form.region} onChange={set('region')}>
            {REGION_NAMES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <input type="tel" placeholder={t('admin', 'storePhone')} className={field} style={inputStyle} value={form.phone} onChange={set('phone')} maxLength={30} />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1.5 text-xs" style={{ color: V('--th-text-sub') }}>{t('admin', 'openTime')}</label>
            <input type="time" className={field} style={inputStyle} value={form.openTime} onChange={set('openTime')} />
          </div>
          <div className="flex-1">
            <label className="block mb-1.5 text-xs" style={{ color: V('--th-text-sub') }}>{t('admin', 'closeTime')}</label>
            <input type="time" className={field} style={inputStyle} value={form.closeTime} onChange={set('closeTime')} />
          </div>
        </div>
        <p className="text-xs" style={{ color: V('--th-text-sub'), lineHeight: 1.5 }}>{t('admin', 'hoursHint')}</p>

        {/* 사진 — AdminGamesTab과 같은 업로드 */}
        <div className="space-y-2">
          <label className="block text-xs" style={{ color: V('--th-text-sub') }}>{t('admin', 'storeImage')}</label>
          <label className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border cursor-pointer" style={{ backgroundColor: V('--th-bg'), borderColor: V('--th-border') }}>
            <span style={{ color: V('--th-primary') }}>📁</span>
            <span className="text-sm truncate" style={{ color: V('--th-text-sub') }}>{imageFile ? imageFile.name : t('admin', 'selectImage')}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          {(imagePreview || form.imageUrl) && (
            <div className="relative w-20 h-20">
              <img src={imagePreview || form.imageUrl} alt="preview" className="w-full h-full object-cover rounded-xl border" style={{ borderColor: V('--th-border') }} />
              <button onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); setImageFile(null); setImagePreview(''); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>✕</button>
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-full disabled:opacity-50" style={{ backgroundColor: V('--th-primary'), color: '#FFFFFF' }}>
            {saving ? t('admin', 'saving') : store ? t('admin', 'update') : t('admin', 'add')}
          </button>
          <button onClick={onCancel} disabled={saving} className="px-5 py-3 rounded-full border" style={{ backgroundColor: V('--th-card'), color: V('--th-text-sub'), borderColor: V('--th-border') }}>
            {t('common', 'cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminStoreForm;
