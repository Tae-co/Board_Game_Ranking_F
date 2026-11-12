import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { createCommunity } from '../api/services/communities';
import { uploadImage } from '../api/uploadImage';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { getAuthUserId, getNickname } from '../auth/storage';
import { enterCommunity, setMyCommunity } from '../utils/storage';
import CommunityPhotoPicker from '../components/shared/CommunityPhotoPicker';
import CommunityInfoFields from '../components/shared/CommunityInfoFields';

const CreateCommunity = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const nickname = getNickname() || '?';

  const [name, setName] = useState('');
  const [region, setRegion] = useState('South Korea');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
      alert(t('common', 'imageUploadFailed'));
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
      const res = await createCommunity({
        name: name.trim(),
        region,
        imageUrl: uploadedImageUrl ?? null,
        adminMemberIds: [],
      });
      setMyCommunity(res);
      enterCommunity(res, getAuthUserId());
      queryClient.invalidateQueries({ queryKey: ['myCommunitiesList'] });
      // 혼자서는 쓸 수 없는 앱이다 — 만들자마자 친구 부르기로 이어간다
      navigate('/invite-friends', { replace: true });
    } catch {
      setError(t('community', 'createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
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
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '28px 20px' }}>

        <CommunityPhotoPicker imagePreview={imagePreview} onSelect={handlePhotoSelect} t={t} />

        {/* Card */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '22px',
        }}>

          <CommunityInfoFields name={name} onNameChange={setName} region={region} onRegionChange={setRegion} t={t} />

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
          {isUploading ? t('common', 'imageUploading') : isSubmitting ? t('community', 'creating') : t('community', 'createCommunity')}
        </button>
      </div>
    </div>
  );
};

export default CreateCommunity;
