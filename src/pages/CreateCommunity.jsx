import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const REGIONS = [
  'South Korea', 'United States', 'Japan', 'China', 'United Kingdom',
  'Germany', 'France', 'Canada', 'Australia', 'Singapore',
  'Hong Kong', 'Taiwan', 'Thailand', 'Vietnam', 'Indonesia',
  'Philippines', 'Malaysia', 'India', 'Brazil', 'Mexico',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Spain', 'Italy', 'Poland', 'Russia', 'Other',
];

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

const CreateCommunity = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const nickname = localStorage.getItem('nickname') || '?';
  const userId = Number(localStorage.getItem('userId'));

  const [name, setName] = useState('');
  const [region, setRegion] = useState('South Korea');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setUploadedImageUrl(url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('community', 'nameRequired'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/communities', {
        name: name.trim(),
        region,
        imageUrl: uploadedImageUrl ?? null,
        createdBy: userId,
        adminMemberIds: [],
      });
      localStorage.setItem('myCommunity', JSON.stringify(res.data));
      queryClient.invalidateQueries({ queryKey: ['myCommunitiesList', String(userId)] });
      navigate('/community', { replace: true });
    } catch {
      setError(t('community', 'createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), paddingBottom: 48 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: V('--th-nav-bg'),
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={22} color={V('--th-primary')} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: '700', color: V('--th-primary') }}>
            {t('community', 'createCommunity')}
          </span>
        </div>
        <div
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'var(--th-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(123,108,246,0.3)',
          }}
        >
          {(nickname || '?')[0].toUpperCase()}
        </div>
      </div>

      <div style={{ padding: '28px 20px' }}>

        {/* Photo upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              width: 100, height: 100, borderRadius: '18px',
              border: imagePreview ? 'none' : `2px dashed var(--th-border)`,
              backgroundColor: V('--th-card'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: '12px',
              overflow: 'hidden', position: 'relative',
            }}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={24} color="#fff" strokeWidth={1.5} />
                </div>
              </>
            ) : (
              <Camera size={32} color={V('--th-text-sub')} strokeWidth={1.5} />
            )}
          </div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', textAlign: 'center', margin: 0 }}>
            {imagePreview ? t('community', 'changePhoto') || '사진 변경' : t('community', 'uploadPhoto')}
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '22px',
        }}>

          {/* Community Name */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', color: V('--th-text'), display: 'block', marginBottom: '8px' }}>
              {t('community', 'communityNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('community', 'communityNamePlaceholder')}
              style={{
                width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                borderRadius: '12px', border: `1px solid var(--th-border)`,
                backgroundColor: V('--th-bg'), color: V('--th-text'),
                fontSize: '14px', outline: 'none',
              }}
            />
          </div>

          {/* Region */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', color: V('--th-text'), display: 'block', marginBottom: '8px' }}>
              {t('community', 'regionLabel')}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                borderRadius: '12px', border: `1px solid var(--th-border)`,
                backgroundColor: V('--th-bg'), color: V('--th-text'),
                fontSize: '14px', outline: 'none', cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                paddingRight: '40px',
              }}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Terms */}
          <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
            {t('community', 'termsText')}
          </p>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center', marginTop: '12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          style={{
            width: '100%', marginTop: '24px', padding: '16px',
            borderRadius: '14px', border: 'none', cursor: (isSubmitting || isUploading) ? 'not-allowed' : 'pointer',
            background: (isSubmitting || isUploading)
              ? 'var(--th-border)'
              : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: '16px', fontWeight: '700',
            boxShadow: (isSubmitting || isUploading) ? 'none' : '0 4px 16px rgba(107,92,231,0.35)',
          }}
        >
          {isUploading ? '사진 업로드 중...' : isSubmitting ? t('community', 'creating') : t('community', 'createCommunity')}
        </button>
      </div>
    </div>
  );
};

export default CreateCommunity;
