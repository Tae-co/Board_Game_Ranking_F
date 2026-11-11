import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티 만들기·수정 화면의 대표 사진 고르기 (100px 정사각, 누르면 파일 선택) */
const CommunityPhotoPicker = ({ imagePreview, onSelect, t }) => {
  const fileInputRef = useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={onSelect}
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
        {imagePreview ? t('community', 'changePhoto') : t('community', 'uploadPhoto')}
      </p>
    </div>
  );
};

export default CommunityPhotoPicker;
