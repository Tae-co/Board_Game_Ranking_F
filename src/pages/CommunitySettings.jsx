import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Search, Check, Trash2, Copy, CheckCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getCommunity, getCommunityMembers, updateCommunity, deleteCommunity } from '../api/services/communities';
import { uploadImage } from '../api/uploadImage';
import { useLanguage } from '../i18n/LanguageContext';
import { useSwipePaging } from '../hooks/useSwipePaging';
import NavAvatar from '../components/NavAvatar';
import RoleBadge from '../components/shared/RoleBadge';
import { V } from '../utils/cssUtils';
import { REGION_NAMES } from '../constants/regions';
import { getAuthUserId } from '../auth/storage';
import { getMyCommunity, setMyCommunity, removeMyCommunity, getSelectedCommunity, setSelectedCommunity, removeSelectedCommunity, notifySelectedCommunityUpdated } from '../utils/storage';
import { EVENTS, logEvent } from '../api/services/events';

const REGIONS = [...REGION_NAMES, 'Other'];

const CommunitySettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [adminPage, setAdminPage] = useState(0);
  const ADMIN_PER_PAGE = 10;
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

  // 검색어 기준 클라이언트 필터
  const filteredMembers = searchQuery.trim()
    ? allMembers.filter((m) =>
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMembers;
  const totalAdminPages = Math.ceil(filteredMembers.length / ADMIN_PER_PAGE);
  const pagedAdminMembers = filteredMembers.slice(adminPage * ADMIN_PER_PAGE, (adminPage + 1) * ADMIN_PER_PAGE);
  const adminSwipe = useSwipePaging(adminPage, totalAdminPages, setAdminPage);

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
      setError(err?.response?.data?.message || t('community', 'updateFailed'));
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
          <NavAvatar size={36} fontSize={14} />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '28px 20px' }}>

        {/* Photo upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
            {imagePreview ? t('community', 'changePhoto') : t('community', 'uploadPhoto')}
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
              value={`${window.location.origin}/join?code=${detail.inviteCode}`}
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
                onClick={async () => {
                  logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'invite_code' } });
                  try {
                    await navigator.clipboard.writeText(detail.inviteCode);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  } catch {
                    alert(t('invite', 'shareUnavailable'));
                  }
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
              onChange={(e) => { setSearchQuery(e.target.value); setAdminPage(0); }}
              placeholder={t('community', 'searchByNickname')}
              style={{
                flex: 1, border: 'none', outline: 'none',
                backgroundColor: 'transparent', color: V('--th-text'), fontSize: '14px',
              }}
            />
          </div>

          {/* 소유자 — 공동 어드민은 해제할 수 없어 체크된 채 고정 */}
          {ownerInfo && (
            <div style={{
              padding: '10px 12px', marginBottom: '2px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: 'rgba(107,92,231,0.08)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'var(--th-primary)', border: `2px solid var(--th-primary)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700', color: '#fff',
              }}>
                {ownerInfo.nickname[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '14px', fontWeight: '500', color: 'var(--th-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ownerInfo.nickname}
                </span>
                <RoleBadge owner />
              </span>
              <Check size={16} color="var(--th-primary)" strokeWidth={2.5} />
            </div>
          )}

          {/* Member list */}
          <div {...adminSwipe} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredMembers.length === 0 ? (
              <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0', margin: 0 }}>
                {t('community', 'searchNoResult')}
              </p>
            ) : (
              pagedAdminMembers.map((m) => {
                const isSelected = selectedIds.has(m.memberId);
                const isDisabled = !isSelected && selectedIds.size >= maxSelected;
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
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: '500', textAlign: 'left',
                        color: isSelected ? 'var(--th-primary)' : V('--th-text'),
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {m.nickname}
                      </span>
                      {m.memberId === userId && (
                        <span style={{ flexShrink: 0, fontSize: '11px', color: V('--th-text-sub') }}>{t('invite', 'me')}</span>
                      )}
                      {m.memberId === detail?.createdBy && <RoleBadge owner />}
                    </span>
                    {isSelected && (
                      <Check size={16} color="var(--th-primary)" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalAdminPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setAdminPage(p => Math.max(0, p - 1))}
                disabled={adminPage === 0}
                style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'), color: adminPage === 0 ? V('--th-text-sub') : V('--th-text'), cursor: adminPage === 0 ? 'not-allowed' : 'pointer' }}
              >
                ‹
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: V('--th-text-sub') }}>{adminPage + 1} / {totalAdminPages}</span>
              <button
                onClick={() => setAdminPage(p => Math.min(totalAdminPages - 1, p + 1))}
                disabled={adminPage >= totalAdminPages - 1}
                style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'), color: adminPage >= totalAdminPages - 1 ? V('--th-text-sub') : V('--th-text'), cursor: adminPage >= totalAdminPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                ›
              </button>
            </div>
          )}
        </div>

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
