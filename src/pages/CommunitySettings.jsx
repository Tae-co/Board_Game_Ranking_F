import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Search, Check, Trash2, Copy, CheckCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

const V = (v) => `var(${v})`;

const REGIONS = [
  'South Korea', 'United States', 'Japan', 'China', 'United Kingdom',
  'Germany', 'France', 'Canada', 'Australia', 'Singapore',
  'Hong Kong', 'Taiwan', 'Thailand', 'Vietnam', 'Indonesia',
  'Philippines', 'Malaysia', 'India', 'Brazil', 'Mexico',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Spain', 'Italy', 'Poland', 'Russia', 'Other',
];

const CommunitySettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const nickname = localStorage.getItem('nickname') || '?';
  const userId = Number(localStorage.getItem('userId'));

  const storedCommunity = (() => {
    try { return JSON.parse(localStorage.getItem('myCommunity')); } catch { return null; }
  })();

  useEffect(() => {
    if (!storedCommunity) navigate('/community', { replace: true });
  }, [navigate, storedCommunity]);

  const communityId = storedCommunity?.communityId;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['communityDetail', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}`);
      return res.data;
    },
    enabled: !!communityId,
    staleTime: 0,
  });

  // 전체 멤버 목록 (자신 제외)
  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['memberSearch', userId],
    queryFn: async () => {
      const res = await api.get('/members/search', { params: { excludeId: userId } });
      return res.data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const [name, setName] = useState('');
  const [region, setRegion] = useState('South Korea');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const initialized = useRef(false);

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

  // 기존 데이터로 폼 초기화
  useEffect(() => {
    if (detail && !initialized.current) {
      initialized.current = true;
      setName(detail.name || '');
      setRegion(detail.region || 'South Korea');
      if (detail.imageUrl) {
        setImagePreview(detail.imageUrl);
      }
      const existingIds = new Set(
        (detail.admins || [])
          .filter((a) => a.memberId !== userId)
          .map((a) => a.memberId)
      );
      setSelectedIds(existingIds);
    }
  }, [detail, userId]);

  const toggleAdmin = (memberId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        if (next.size >= 4) return prev; // 생성자 포함 최대 5명
        next.add(memberId);
      }
      return next;
    });
  };

  // 검색어 기준 클라이언트 필터
  const filteredMembers = searchQuery.trim()
    ? allMembers.filter((m) =>
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMembers;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('community', 'nameRequired'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/communities/${communityId}`, {
        name: name.trim(),
        region,
        imageUrl: uploadedImageUrl ?? (detail?.imageUrl ?? null),
        adminMemberIds: [...selectedIds],
      });
      localStorage.setItem('myCommunity', JSON.stringify(res.data));
      queryClient.invalidateQueries({ queryKey: ['myCommunitiesList', String(userId)] });
      queryClient.invalidateQueries({ queryKey: ['communityDetail', communityId] });
      navigate('/community', { replace: true });
    } catch {
      setError(t('community', 'updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/communities/${communityId}`);
      localStorage.removeItem('myCommunity');
      localStorage.removeItem('selectedCommunity');
      queryClient.removeQueries({ queryKey: ['myCommunitiesList'] });
      queryClient.removeQueries({ queryKey: ['communityRooms'] });
      navigate('/community', { replace: true });
    } catch {
      setError(t('community', 'deleteFailed'));
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = detailLoading || membersLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: V('--th-text-sub'), fontSize: '14px' }}>{t('common', 'loading')}</p>
      </div>
    );
  }

  const totalAdminCount = selectedIds.size + 1; // +1 for creator

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
            {t('community', 'editCommunity')}
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

        {/* 초대 코드 + QR 카드 */}
        {detail?.inviteCode && (
          <div style={{
            backgroundColor: V('--th-card'), borderRadius: '20px',
            border: `1px solid var(--th-border)`, padding: '20px',
            marginBottom: '20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), margin: '0 0 16px' }}>
              {t('community', 'inviteCode')}
            </p>
            <QRCodeSVG
              value={detail.inviteCode}
              size={140}
              bgColor="transparent"
              fgColor="var(--th-text)"
              style={{ display: 'block', margin: '0 auto 16px' }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              backgroundColor: V('--th-bg'), borderRadius: '12px',
              padding: '12px 16px', border: `1px solid var(--th-border)`,
            }}>
              <span style={{
                fontSize: '22px', fontWeight: '800', letterSpacing: '0.18em',
                color: 'var(--th-primary)', fontFamily: 'monospace',
              }}>
                {detail.inviteCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(detail.inviteCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                {codeCopied
                  ? <CheckCheck size={18} color="#22c55e" />
                  : <Copy size={18} color="var(--th-text-sub)" />
                }
              </button>
            </div>
          </div>
        )}

        {/* Basic info card */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '22px',
          marginBottom: '20px',
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
        </div>

        {/* Admins card */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '20px',
          marginBottom: '20px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text') }}>
              {t('community', 'adminsLabel')}
            </span>
            <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
              {totalAdminCount}{t('community', 'adminsSelected')}
            </span>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '12px',
            border: `1px solid var(--th-border)`,
            backgroundColor: V('--th-bg'), marginBottom: '12px',
          }}>
            <Search size={15} color={V('--th-text-sub')} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('community', 'searchByNickname')}
              style={{
                flex: 1, border: 'none', outline: 'none',
                backgroundColor: 'transparent', color: V('--th-text'), fontSize: '14px',
              }}
            />
          </div>

          {/* Member list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredMembers.length === 0 ? (
              <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0', margin: 0 }}>
                {t('community', 'searchNoResult')}
              </p>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedIds.has(m.memberId);
                const isDisabled = !isSelected && selectedIds.size >= 4;
                return (
                  <button
                    key={m.memberId}
                    onClick={() => !isDisabled && toggleAdmin(m.memberId)}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none',
                      borderRadius: '10px', cursor: isDisabled ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      backgroundColor: isSelected ? 'rgba(107,92,231,0.08)' : 'transparent',
                      transition: 'background-color 0.15s',
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: isSelected ? 'var(--th-primary)' : 'var(--th-bg)',
                      border: `2px solid ${isSelected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '700',
                      color: isSelected ? '#fff' : V('--th-text-sub'),
                      transition: 'all 0.15s',
                    }}>
                      {m.nickname[0].toUpperCase()}
                    </div>

                    {/* Nickname */}
                    <span style={{
                      flex: 1, fontSize: '14px', fontWeight: '500', textAlign: 'left',
                      color: isSelected ? 'var(--th-primary)' : V('--th-text'),
                    }}>
                      {m.nickname}
                    </span>

                    {/* Check icon */}
                    {isSelected && (
                      <Check size={16} color="var(--th-primary)" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '14px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting
              ? 'var(--th-border)'
              : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: '16px', fontWeight: '700',
            boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(107,92,231,0.35)',
            marginBottom: '12px',
          }}
        >
          {isSubmitting ? t('community', 'saving') : t('community', 'saveChanges')}
        </button>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            width: '100%', padding: '15px',
            borderRadius: '14px', border: '1px solid rgba(239,68,68,0.35)',
            cursor: 'pointer', backgroundColor: 'transparent',
            color: '#ef4444', fontSize: '15px', fontWeight: '600',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Trash2 size={16} />
          {t('community', 'deleteCommunity')}
        </button>
      </div>

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 0 0',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: '390px',
            backgroundColor: V('--th-card'),
            borderRadius: '24px 24px 0 0',
            padding: '28px 24px 40px',
          }}>
            {/* 빨간 아이콘 */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              backgroundColor: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <Trash2 size={24} color="#ef4444" />
            </div>

            <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), textAlign: 'center', margin: '0 0 10px' }}>
              {t('community', 'deleteConfirmTitle')}
            </p>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
              {t('community', 'deleteConfirmDesc')}
            </p>

            {/* 커뮤니티 이름 표시 */}
            <div style={{
              backgroundColor: V('--th-bg'), borderRadius: '12px',
              padding: '12px 16px', textAlign: 'center', marginBottom: '24px',
              border: `1px solid var(--th-border)`,
            }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text') }}>
                {name || storedCommunity?.name}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '12px', border: `1px solid var(--th-border)`,
                  backgroundColor: V('--th-bg'), color: V('--th-text'),
                  fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '12px', border: 'none',
                  backgroundColor: '#ef4444', color: '#fff',
                  fontSize: '15px', fontWeight: '700',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? t('community', 'deleting') : t('community', 'deleteConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
