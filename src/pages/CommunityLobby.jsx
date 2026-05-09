import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Hash, Shield } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import StorageImage from '../components/StorageImage';
import { CommunityCardSkeleton } from '../components/Skeleton';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { getAvatarColorByStr as avatarColor } from '../utils/avatarUtils';

const DiceLogo = () => (
  <img src="/logo.png" width="28" height="28" style={{ objectFit: 'contain' }} alt="logo" />
);

const AvatarStack = ({ admins = [], memberCount = 0 }) => {
  const visible = admins.slice(0, 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((admin, i) => (
          <div
            key={admin.memberId}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: avatarColor(admin.nickname),
              border: `2px solid var(--th-card)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
              marginLeft: i === 0 ? 0 : -8,
              zIndex: visible.length - i,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {admin.profileImage
              ? <StorageImage src={admin.profileImage} alt={admin.nickname} loading="lazy" decoding="async" transform={{ width: 56, height: 56, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : (admin.nickname || '?')[0].toUpperCase()
            }
          </div>
        ))}
      </div>
      {memberCount > 0 && (
        <span style={{
          fontSize: '12px', fontWeight: '600', color: V('--th-text-sub'),
          backgroundColor: V('--th-bg'),
          border: `1px solid var(--th-border)`,
          borderRadius: '20px', padding: '2px 8px',
        }}>
          +{memberCount > 999 ? `${Math.floor(memberCount / 1000)}k` : memberCount}
        </span>
      )}
    </div>
  );
};

const CommunityLobby = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const nickname = localStorage.getItem('nickname') || '?';
  const userId = localStorage.getItem('userId');
  const isSystemAdmin = localStorage.getItem('role') === 'ADMIN';

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const { data: myCommunities = [], isLoading: myLoading } = useQuery({
    queryKey: ['myCommunitiesList', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/communities/my/list/${userId}`);
      return res.data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (myCommunities.length > 0) localStorage.setItem('myCommunity', JSON.stringify(myCommunities[0]));
    else if (myCommunities.length === 0 && userId) localStorage.removeItem('myCommunity');
  }, [myCommunities, userId]);

  const { data: joinedCommunities = [], isLoading: joinedLoading } = useQuery({
    queryKey: ['joinedCommunities', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.get(`/communities/joined/${userId}`);
      return res.data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const handleEnterCommunity = (community) => {
    const isAdmin = (community.admins ?? []).some(a => a.memberId === Number(userId));
    localStorage.setItem('selectedCommunity', JSON.stringify({
      communityId: community.communityId,
      name: community.name,
      isAdmin,
      inviteCode: community.inviteCode ?? null,
      imageUrl: community.imageUrl ?? null,
      region: community.region ?? null,
      memberCount: community.memberCount ?? 0,
    }));
    navigate('/lobby');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    setJoinLoading(true);
    try {
      await api.post('/communities/join', { inviteCode: joinCode.trim(), memberId: Number(userId) });
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities', userId] });
    } catch (e) {
      setJoinError(e.response?.data?.message || t('community', 'invalidCode'));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleManage = (community) => {
    localStorage.setItem('myCommunity', JSON.stringify(community));
    navigate('/manage-community');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiceLogo />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              Yada Rank
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSystemAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
              >
                <Shield style={{ width: 20, height: 20 }} />
              </button>
            )}
            <NavAvatar />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Welcome Banner */}
        <div style={{
          borderRadius: '20px',
          padding: '24px 22px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)' }}/>
          <div style={{ position: 'absolute', right: 30, top: -30, width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}/>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Hi, {nickname}!
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            Ready to manage your collectives<br/>today?
          </p>
        </div>

        {/* Join Community 섹션 */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '18px',
          border: `1px solid var(--th-border)`, padding: '18px',
          marginBottom: '28px', overflow: 'hidden',
        }}>
          <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text'), margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Hash size={16} color="var(--th-primary)" />
            {t('community', 'joinCommunity')}
          </p>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={t('community', 'enterInviteCode')}
              style={{
                flex: 1, minWidth: 0, padding: '10px 12px',
                borderRadius: '10px', border: `1px solid ${joinError ? '#ef4444' : 'var(--th-border)'}`,
                backgroundColor: V('--th-bg'), color: V('--th-text'),
                fontSize: '13px', fontWeight: '600', letterSpacing: '0.08em',
                outline: 'none',
              }}
            />
            <button
              onClick={handleJoin}
              disabled={joinLoading || !joinCode.trim()}
              style={{
                padding: '10px 16px', borderRadius: '10px', border: 'none',
                cursor: joinLoading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                background: joinLoading || !joinCode.trim()
                  ? 'var(--th-border)'
                  : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: '14px', fontWeight: '700', flexShrink: 0,
              }}
            >
              {joinLoading ? '...' : t('community', 'joinWithCodeBtn')}
            </button>
          </div>
          {joinError && (
            <p style={{ fontSize: '12px', color: '#ef4444', margin: '6px 0 0' }}>{joinError}</p>
          )}
        </div>

        {/* My Community 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
            {t('community', 'myCommunity')}
          </p>
          {/* 이미 커뮤니티가 있을 때만 + 버튼 표시 */}
          {myCommunities.length > 0 && (
            <button
              onClick={() => navigate('/create-community')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(107,92,231,0.3)',
              }}
            >
              <Plus size={16} color="#fff" />
            </button>
          )}
        </div>

        {myLoading ? (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, paddingLeft: 10 }}>
            {[0, 1].map(i => <div key={i} style={{ flex: '0 0 calc(100% - 40px)' }}><CommunityCardSkeleton /></div>)}
          </div>
        ) : myCommunities.length === 0 ? (
          /* 커뮤니티 없을 때 — Create CTA */
          <button
            onClick={() => navigate('/create-community')}
            style={{
              width: '100%', borderRadius: '18px', padding: '28px 24px',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
              position: 'relative', overflow: 'hidden', marginBottom: '28px',
              display: 'block',
            }}
          >
            <div style={{ position: 'absolute', right: -10, bottom: -20, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}/>
            <div style={{ position: 'absolute', right: 40, top: -20, width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}/>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Plus size={18} color="#fff" />
            </div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
              {t('community', 'createCommunity')}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
              {t('community', 'createCommunityDesc')}
            </p>
          </button>
        ) : (
          /* 가로 스와이프 커뮤니티 카드 */
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              marginLeft: '-10px',
              marginRight: '-20px',
              paddingLeft: '20px',
              paddingRight: '20px',
              paddingBottom: '4px',
              marginBottom: '28px',
            }}
          >
            {myCommunities.map((community) => (
              <div
                key={community.communityId}
                style={{
                  flex: '0 0 calc(100% - 40px)',
                  scrollSnapAlign: 'start',
                  borderRadius: '18px', padding: '18px',
                  backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {/* 프로필 이미지 + Manage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                    backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {community.imageUrl ? (
                      <StorageImage src={community.imageUrl} alt={community.name} loading="lazy" decoding="async" transform={{ width: 96, height: 96, quality: 70 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: '800', color: '#fff',
                      }}>
                        {(community.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleManage(community)}
                    style={{
                      fontSize: '12px', fontWeight: '600', color: V('--th-text'),
                      backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
                      borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
                    }}
                  >
                    {t('community', 'manage')}
                  </button>
                </div>

                {/* 이름 + 그룹 수 */}
                <p style={{ fontSize: '20px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px' }}>
                  {community.name}
                </p>
                <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} />
                  {community.groupCount} {t('community', 'groups')}
                </p>

                {/* 아바타 스택 */}
                <AvatarStack admins={community.admins ?? []} memberCount={community.memberCount ?? 0} />

                {/* Enter 버튼 */}
                <button
                  onClick={() => handleEnterCommunity(community)}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                    color: '#fff', fontSize: '15px', fontWeight: '700',
                  }}
                >
                  {t('community', 'enterCommunity')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 참가한 커뮤니티 */}
        <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), marginBottom: '14px' }}>
          {t('community', 'joinedCommunities')}
        </p>
        {joinedLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[0, 1].map(i => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : joinedCommunities.length === 0 ? (
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0 28px' }}>
            {t('community', 'noJoinedCommunities')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {joinedCommunities.map((community) => (
              <div
                key={community.communityId}
                style={{
                  borderRadius: '18px', padding: '18px',
                  backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px', overflow: 'hidden',
                    backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {community.imageUrl ? (
                      <StorageImage src={community.imageUrl} alt={community.name} loading="lazy" decoding="async" transform={{ width: 96, height: 96, quality: 70 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: '800', color: '#fff',
                      }}>
                        {(community.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px' }}>
                  {community.name}
                </p>
                <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} />
                  {community.groupCount} {t('community', 'groups')}
                </p>
                <AvatarStack admins={community.admins ?? []} memberCount={community.memberCount ?? 0} />
                <button
                  onClick={() => handleEnterCommunity(community)}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                    color: '#fff', fontSize: '15px', fontWeight: '700',
                  }}
                >
                  {t('community', 'enterCommunity')}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

const RoomCard = ({ room, manageLabel, activeLabel, inactiveLabel, onManage }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      backgroundColor: 'var(--th-card)', borderRadius: '14px',
      padding: '14px 16px', border: '1px solid var(--th-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--th-bg)' }}>
        {room.imageUrl && !imgError ? (
          <StorageImage src={room.imageUrl} alt={room.roomName} onError={() => setImgError(true)} transform={{ width: 104, height: 104, quality: 70 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎲</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--th-text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.roomName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            backgroundColor: room.sessionActive ? '#22c55e' : 'var(--th-text-sub)',
          }}/>
          <span style={{ fontSize: '12px', color: 'var(--th-text-sub)', fontWeight: '500' }}>
            {room.sessionActive ? activeLabel : inactiveLabel}
          </span>
        </div>
      </div>
      <button
        onClick={onManage}
        style={{
          fontSize: '12px', fontWeight: '600', color: 'var(--th-text)',
          backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)',
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {manageLabel}
      </button>
    </div>
  );
};

export default CommunityLobby;
