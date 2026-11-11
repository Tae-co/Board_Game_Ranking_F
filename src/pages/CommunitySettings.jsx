import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getCommunity, getCommunityMembers, updateCommunity, deleteCommunity } from '../api/services/communities';
import { uploadImage } from '../api/uploadImage';
import { useLanguage } from '../i18n/LanguageContext';
import NavAvatar from '../components/NavAvatar';
import CommunityPhotoPicker from '../components/shared/CommunityPhotoPicker';
import CommunityInfoFields from '../components/shared/CommunityInfoFields';
import InviteCodeCard from '../components/community/InviteCodeCard';
import AdminPicker from '../components/community/AdminPicker';
import DeleteCommunityModal from '../components/community/DeleteCommunityModal';
import { V } from '../utils/cssUtils';
import { getAuthUserId } from '../auth/storage';
import { getMyCommunity, setMyCommunity, removeMyCommunity, getSelectedCommunity, setSelectedCommunity, removeSelectedCommunity, notifySelectedCommunityUpdated } from '../utils/storage';
import { useApiErrorMessage } from '../hooks/useApiErrorMessage';

const CommunitySettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const errorText = useApiErrorMessage();
  const userId = Number(getAuthUserId());

  const storedCommunity = getMyCommunity();

  useEffect(() => {
    if (!storedCommunity) navigate('/community', { replace: true });
  }, [navigate, storedCommunity]);

  const communityId = storedCommunity?.communityId;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['communityDetail', communityId],
    queryFn: () => getCommunity(communityId),
    enabled: !!communityId,
    staleTime: 0,
  });

  // 소유자(처음엔 생성자)는 항상 어드민이다. 소유자 본인만 자기 체크를 풀어 내려놓을 수 있고,
  // 그러면 서버가 가장 오래된 어드민에게 소유권(삭제 권한 포함)을 넘긴다.
  const isOwner = detail?.createdBy === userId;
  // 선택 목록에 들어가는 최대 인원. 내가 소유자가 아니면 소유자 1명은 목록 밖에 있다.
  const maxSelected = isOwner ? 5 : 4;

  // 커뮤니티 멤버 목록
  const { data: communityMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => getCommunityMembers(communityId),
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });

  const [name, setName] = useState('');
  const [region, setRegion] = useState('South Korea');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const initialized = useRef(false);
  const adminsTouched = useRef(false);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const url = await uploadImage(file, detail?.imageUrl);
      setUploadedImageUrl(url);
    } catch (err) {
      alert(err?.code ? t('common', err.code) : t('common', 'imageUploadFailed'));
      setImagePreview(detail?.imageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  // 기존 데이터로 폼 초기화
  useEffect(() => {
    if (detail) {
      if (!initialized.current) {
        initialized.current = true;
        setName(detail.name || '');
        setRegion(detail.region || 'South Korea');
        if (detail.imageUrl) setImagePreview(detail.imageUrl);
      }
      // 어드민 선택은 유저가 수동으로 건드리기 전까지 API 응답과 동기화
      if (!adminsTouched.current) {
        const existingIds = new Set(
          (detail.admins || [])
            .filter((a) => a.memberId !== detail.createdBy || detail.createdBy === userId)
            .map((a) => a.memberId)
        );
        setSelectedIds(existingIds);
      }
    }
  }, [detail, userId]);

  const toggleAdmin = (memberId) => {
    adminsTouched.current = true;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        if (next.size >= maxSelected) return prev; // 소유자 포함 최대 5명
        next.add(memberId);
      }
      return next;
    });
  };

  // 남이 해제할 수 없는 소유자는 목록에서 뺀다. 내가 소유자면 내려놓을 수 있게 남긴다.
  // 나는 항상 목록에 있다 — 자기 체크를 직접 풀 때만 어드민에서 빠진다.
  const allMembers = isOwner
    ? communityMembers
    : communityMembers.filter((m) => m.memberId !== detail?.createdBy);

  // 공동 어드민 화면에서 목록 밖의 소유자를 맨 위에 고정해 보여준다
  const ownerInfo = isOwner ? null
    : communityMembers.find((m) => m.memberId === detail?.createdBy)
      ?? (detail?.admins ?? []).find((a) => a.memberId === detail?.createdBy);

  // 소유자가 내려놓을 때 넘겨받을 사람 — 서버와 같은 규칙(남는 어드민 중 가장 오래된 사람).
  // 상세의 어드민 목록이 어드민이 된 순서이고, 새로 추가한 사람은 그 뒤에 선택한 순서로 붙는다.
  const findNextOwner = () => {
    const kept = (detail?.admins ?? []).filter((a) => a.memberId !== userId && selectedIds.has(a.memberId));
    if (kept.length > 0) return kept[0];
    const addedId = [...selectedIds].find((id) => id !== userId);
    return communityMembers.find((m) => m.memberId === addedId) ?? null;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('community', 'nameRequired'));
      return;
    }
    const ownerLeaves = isOwner && !selectedIds.has(userId);
    if (ownerLeaves) {
      // 넘겨받을 사람이 없으면 서버가 이유를 담아 거절한다
      const next = findNextOwner();
      if (next && !window.confirm(t('community', 'ownerLeaveConfirm').replace('{n}', next.nickname))) return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await updateCommunity(communityId, {
        name: name.trim(),
        region,
        imageUrl: uploadedImageUrl ?? (detail?.imageUrl ?? null),
        adminMemberIds: [...selectedIds],
        ownerLeavesAdmin: ownerLeaves,
      });
      setMyCommunity(res);
      const parsed = getSelectedCommunity();
      if (parsed && String(parsed.communityId) === String(communityId)) {
        setSelectedCommunity({
          ...parsed,
          name: name.trim(),
          imageUrl: uploadedImageUrl ?? detail?.imageUrl ?? null,
          // 내 체크를 풀었으면 어드민이 아니다 — 어드민 버튼이 남아 있지 않게 바로 반영한다
          isAdmin: (res.admins ?? []).some((a) => a.memberId === userId),
        });
        notifySelectedCommunityUpdated();
      }
      const updatedName = name.trim();
      const updatedImageUrl = uploadedImageUrl ?? detail?.imageUrl ?? null;
      const patchList = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(c => String(c.communityId) === String(communityId)
          ? { ...c, name: updatedName, imageUrl: updatedImageUrl }
          : c
        );
      };
      queryClient.setQueriesData({ queryKey: ['myCommunitiesList'] }, patchList);
      queryClient.setQueriesData({ queryKey: ['joinedCommunities'] }, patchList);
      // 소유권 이전·어드민 변경은 패치로 못 따라간다 — 내 커뮤니티/참여 목록과 관리 버튼이 바로 바뀌게 다시 받는다
      queryClient.invalidateQueries({ queryKey: ['myCommunitiesList'] });
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities'] });
      queryClient.invalidateQueries({ queryKey: ['communityDetail', communityId] });
      navigate('/community', { replace: true });
    } catch (err) {
      // 혼자인 소유자가 내려놓으려 하면 서버가 이유를 담아 거절한다
      setError(errorText(err, t('community', 'updateFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCommunity(communityId);
      removeMyCommunity();
      removeSelectedCommunity();
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

  const totalAdminCount = selectedIds.size + (isOwner ? 0 : 1); // 내가 소유자가 아니면 목록 밖 소유자 1명

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
              {t('community', 'editCommunity')}
            </span>
          </div>
          <NavAvatar size={36} />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '28px 20px' }}>

        <CommunityPhotoPicker imagePreview={imagePreview} onSelect={handlePhotoSelect} t={t} />

        {detail?.inviteCode && (
          <InviteCodeCard communityId={communityId} inviteCode={detail.inviteCode} t={t} />
        )}

        {/* Basic info card */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '22px',
          marginBottom: '20px',
        }}>
          <CommunityInfoFields name={name} onNameChange={setName} region={region} onRegionChange={setRegion} t={t} />
        </div>

        <AdminPicker
          members={allMembers}
          ownerInfo={ownerInfo}
          ownerId={detail?.createdBy}
          userId={userId}
          selectedIds={selectedIds}
          maxSelected={maxSelected}
          totalAdminCount={totalAdminCount}
          onToggle={toggleAdmin}
          t={t}
        />

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '14px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: (isSubmitting || isUploading)
              ? 'var(--th-border)'
              : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: '16px', fontWeight: '700',
            boxShadow: (isSubmitting || isUploading) ? 'none' : '0 4px 16px rgba(107,92,231,0.35)',
            marginBottom: '12px',
          }}
        >
          {isUploading ? t('common', 'imageUploading') : isSubmitting ? t('community', 'saving') : t('community', 'saveChanges')}
        </button>

        {/* Delete button — 소유자만 삭제할 수 있다 (서버도 같은 규칙) */}
        {isOwner && <button
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
        </button>}
      </div>

      {showDeleteModal && (
        <DeleteCommunityModal
          communityName={name || storedCommunity?.name}
          isDeleting={isDeleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          t={t}
        />
      )}
    </div>
  );
};

export default CommunitySettings;
