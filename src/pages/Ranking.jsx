import { memo, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Share2 } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import StorageImage from '../components/StorageImage';
import { RankRowSkeleton } from '../components/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { REGION_TIMEZONE } from '../constants/regions';
import { formatDate, formatTime, ordinalSuffix } from '../utils/dateUtils';
import MedalBadge from '../components/shared/MedalBadge';
import InitialAvatar from '../components/shared/InitialAvatar';


const buildSavedScores = (participants) => {
  const first = participants.find(p => p.scoresJson);
  if (!first) return null;
  try {
    const sample = JSON.parse(first.scoresJson);
    if (Array.isArray(sample.rounds) || sample.hpMap !== undefined) {
      return { "_data": { "all": first.scoresJson } };
    }
  } catch { return null; }

  const savedScores = {};
  participants.forEach((p) => {
    if (!p.scoresJson) return;
    try {
      const parsed = JSON.parse(p.scoresJson);
      Object.entries(parsed).forEach(([catKey, val]) => {
        if (!savedScores[catKey]) savedScores[catKey] = {};
        savedScores[catKey][p.memberId] = val;
      });
    } catch { /* ignore */ }
  });
  return Object.keys(savedScores).length > 0 ? savedScores : null;
};

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const myUserId = Number(localStorage.getItem('userId'));
  const communityRegion = (() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity'))?.region; } catch { return null; }
  })();
  const communityTimezone = REGION_TIMEZONE[communityRegion] || undefined;

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}`); return res.data; },
    staleTime: 1000 * 60 * 10,
  });

  const { data: roomMembers = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/members`); return res.data || []; },
    staleTime: 1000 * 60 * 2,
  });

  const isHost = useMemo(
    () => roomMembers.find(m => m.memberId === myUserId)?.isHost ?? false,
    [roomMembers, myUserId]
  );

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/rankings`); return res.data || []; },
    staleTime: 1000 * 60 * 3,
  });

  const { data: allMatchesRaw = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/matches`); return res.data || []; },
    staleTime: 1000 * 60 * 1,
  });
  const allMatches = room?.boardGameId
    ? allMatchesRaw.filter(m => m.boardGameId === room.boardGameId)
    : allMatchesRaw;

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const gameInfo = useMemo(
    () => games.find(g => g.id === room?.boardGameId) || null,
    [games, room]
  );

  const myRank = useMemo(() => rankings.find(r => r.memberId === myUserId), [rankings, myUserId]);
  const myRankPosition = useMemo(() => {
    const idx = rankings.findIndex(r => r.memberId === myUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [rankings, myUserId]);
  const myWinRate = useMemo(() => {
    if (!myRank || (myRank.winCount + myRank.loseCount) === 0) return 0;
    return Math.round(myRank.winCount / (myRank.winCount + myRank.loseCount) * 100);
  }, [myRank]);

  const nativeShare = (title, text) => {
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    }
  };

  const shareMatchResult = () => {
    if (!matchResult) return;
    const gameName = gameInfo?.name || room?.roomName || '보드게임';
    const lines = matchResult
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .map(r => `${r.nickname} ${r.ratingChange >= 0 ? '+' : ''}${Math.round(r.ratingChange)}`)
      .join(' · ');
    nativeShare(
      `🎮 ${gameName} 한판 결과!`,
      `${lines}\n\nYadaRank에서 보드게임 랭킹을 기록 중이에요 👉 yadarank.com`,
    );
  };

  const shareMyRank = () => {
    if (!myRank || !myRankPosition) return;
    const gameName = gameInfo?.name || room?.roomName || '보드게임';
    const nickname = localStorage.getItem('nickname') || myRank.nickname;
    nativeShare(
      `🏆 ${nickname}의 ${gameName} 랭킹`,
      `${myRankPosition}위 · 레이팅 ${Math.round(myRank.rating)} · 승률 ${myWinRate}% (${myRank.winCount}승 ${myRank.loseCount}패)\n\nYadaRank에서 보드게임 랭킹 관리 중 👉 yadarank.com`,
    );
  };

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await api.put(`/rooms/${roomId}/members/${ratingEditModal.memberId}/rating`, {
        requesterId: myUserId, rating: val,
      });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      setRatingEditModal(null);
    } catch { alert(t('ranking', 'editRatingFailed')); }
    finally { setIsRatingEditSaving(false); }
  };

  const openScoreSheet = useCallback((match, readOnly = false) => {
    const savedScores = buildSavedScores(match.participants);
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId), gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        savedScores, backTo: `/ranking/${roomId}`,
        backState: { activeTab: 'matches' },
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/matches/${matchId}?requesterId=${myUserId}`);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch { alert('삭제에 실패했습니다.'); }
  }, [myUserId, queryClient, refetchMatches, roomId]);

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  const pagedRankings = useMemo(
    () => rankings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [rankings, page]
  );
  const totalPages = useMemo(() => Math.ceil(rankings.length / PAGE_SIZE), [rankings.length]);
  const isLoading = activeTab === 'matches' ? isMatchesLoading : isRankingLoading;

  const podium = useMemo(() => {
    const top = rankings.slice(0, 3);
    // order: 2nd, 1st, 3rd
    return [top[1], top[0], top[2]].filter(Boolean);
  }, [rankings]);

  return (
    <div style={{ backgroundColor: V('--th-bg'), minHeight: '100vh', paddingBottom: 100, fontFamily: "'Pretendard', sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(`/invite/${roomId}`)} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--th-primary)', flexShrink: 0 }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--th-primary)' }}>My Group</span>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto' }}>

      {/* Room info row */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: V('--th-text') }}>{room?.roomName || ''}</span>
      </div>

      {/* Stats card */}
      <div style={{ margin: '16px 16px 0', padding: '16px', borderRadius: 16, background: V('--th-card'), border: `1px solid var(--th-border)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {gameInfo?.imageUrl ? (
            <StorageImage src={gameInfo.imageUrl} alt={gameInfo.name} loading="lazy" decoding="async" transform={{ width: 144, height: 144, quality: 72 }} style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 14, background: V('--th-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎲</div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: V('--th-text'), marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameInfo?.name || room?.roomName || '—'}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsMatches')}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{myRank ? myRank.winCount + myRank.loseCount : 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWins')}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e' }}>{myRank?.winCount ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsLosses')}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{myRank?.loseCount ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWinRate')}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{myWinRate}%</div>
              </div>
            </div>
          </div>
        </div>
        {myRank && myRankPosition && (
          <button
            onClick={shareMyRank}
            style={{
              marginTop: 12, width: '100%', padding: '10px', borderRadius: 10,
              backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)',
              border: '1px solid var(--th-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <Share2 size={15} color="var(--th-primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--th-primary)' }}>
              랭킹 공유하기
            </span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', borderRadius: 24, padding: 4, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
          {[
            { key: 'group', label: t('ranking', 'groupTab') },
            { key: 'matches', label: t('ranking', 'matchesTab') },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.key ? V('--th-primary') : 'transparent',
                color: activeTab === tab.key ? '#fff' : V('--th-text-sub'),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ borderRadius: 12, padding: 14, backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-primary'), margin: 0 }}>🎮 {t('ranking', 'matchResult')}</p>
              <button
                onClick={shareMatchResult}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)',
                  border: '1px solid var(--th-primary)', cursor: 'pointer',
                }}
              >
                <Share2 size={13} color="var(--th-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--th-primary)' }}>결과 공유</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {matchResult.map((r) => (
                <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: V('--th-bg') }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{r.nickname}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.ratingChange > 0 ? '#16a34a' : '#dc2626' }}>
                    {r.ratingChange > 0 ? '+' : ''}{Math.round(r.ratingChange)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 16px 0' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {[0, 1, 2, 3, 4].map(i => <RankRowSkeleton key={i} />)}
          </div>
        ) : activeTab === 'matches' ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>RECENT SESSIONS</div>
            {allMatches.length === 0 ? (
              <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                <p style={{ color: V('--th-text') }}>{t('ranking', 'noMatches')}</p>
                <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noMatchesDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allMatches.map((match) => {
                  const myParticipant = match.participants?.find(p => p.memberId === myUserId);
                  const isVictory = myParticipant?.placement === 1;
                  const ratingChange = myParticipant?.ratingChange ?? 0;
                  const ratingSign = ratingChange >= 0 ? '+' : '';
                  const visibleParticipants = (match.participants || []).slice(0, 3);
                  const extraCount = (match.participants?.length || 0) - 3;
                  const hasScoreData = match.participants?.some(p => p.scoresJson);
                  const resultColor = isVictory ? '#16a34a' : '#dc2626';
                  const resultLabel = isVictory ? 'VICTORY' : `${ordinalSuffix(myParticipant?.placement ?? 0)} PLACE`;
                  return (
                    <div key={match.matchId} style={{ borderRadius: 16, padding: '14px 16px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{formatDate(match.playedAt, communityTimezone)}</div>
                          <div style={{ fontSize: 11, color: V('--th-text-sub'), marginTop: 2 }}>{formatTime(match.playedAt, communityTimezone)} · {match.participants?.length || 0} Players</div>
                        </div>
                        {myParticipant && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: resultColor, lineHeight: 1 }}>
                              {ratingSign}{Math.round(ratingChange)}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: resultColor, marginTop: 2 }}>
                              {resultLabel}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Bottom row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex' }}>
                          {visibleParticipants.map((p, i) => (
                            <div key={p.memberId} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: visibleParticipants.length - i, position: 'relative' }}>
                              <InitialAvatar nickname={p.nickname} profileImage={p.profileImage} size={36} fontSize={14} />
                              {p.placement === 1 && (
                                <div style={{ position: 'absolute', top: -8, left: -2, fontSize: 13, lineHeight: 1 }}>👑</div>
                              )}
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div style={{ marginLeft: -10, width: 36, height: 36, borderRadius: '50%', background: V('--th-border'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), zIndex: 0 }}>
                              +{extraCount}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {hasScoreData && (
                            <button onClick={() => handleViewMatch(match)} style={{ fontSize: 12, fontWeight: 600, color: V('--th-primary'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              Details ›
                            </button>
                          )}
                          {isHost && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {hasScoreData && (
                                <button onClick={() => handleEditMatch(match)} style={{ fontSize: 10, fontWeight: 600, color: V('--th-text-sub'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>
                              )}
                              <button onClick={() => handleDeleteMatch(match.matchId)} style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>삭제</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : rankings.length === 0 ? (
          <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
            <p style={{ fontSize: 17, color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
            <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {rankings.length >= 1 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {/* order: 2nd left, 1st center, 3rd right */}
                {[
                  { rank: rankings[1], place: 2, size: 70, avatarSize: 58, podiumOffset: 0, medalOffset: -6 },
                  { rank: rankings[0], place: 1, size: 90, avatarSize: 82, ring: '#FFD700', podiumOffset: 36, medalOffset: -1 },
                  { rank: rankings[2], place: 3, size: 60, avatarSize: 50, podiumOffset: 0, medalOffset: -4 },
                ].map(({ rank, place, size, avatarSize, ring, podiumOffset, medalOffset }) => {
                  if (!rank) return <div key={place} style={{ flex: 1 }} />;
                  const isMe = rank.memberId === myUserId;
                  return (
                    <div key={rank.memberId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: podiumOffset }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: avatarSize, height: avatarSize, borderRadius: '50%',
                          backgroundColor: V('--th-primary'), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: Math.round(avatarSize * 0.3),
                          border: ring ? `3px solid ${ring}` : 'none',
                          boxSizing: 'border-box', overflow: 'hidden',
                        }}>
                          {rank.profileImage
                            ? <StorageImage src={rank.profileImage} alt={rank.nickname} loading="lazy" decoding="async" transform={{ width: avatarSize * 2, height: avatarSize * 2, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : (rank.nickname || '?')[0].toUpperCase()
                          }
                        </div>
                        <div style={{ position: 'absolute', bottom: medalOffset, right: medalOffset }}>
                          <MedalBadge place={place} size={avatarSize > 56 ? 26 : 22} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: size }}>
                          {rank.nickname}
                        </div>
                        <div style={{ fontSize: 13, color: ring ? '#FFD700' : V('--th-text'), fontWeight: 800 }}>
                          {Math.round(rank.rating).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Column header — always shown when there are rankings */}
            <div style={{
              display: 'flex', padding: '6px 12px', marginBottom: 4, marginTop: 4,
              backgroundColor: V('--th-card'), borderRadius: 8,
              border: '1px solid var(--th-border)',
            }}>
              <div style={{ width: 32, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RANK</div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', paddingLeft: 36 }}>PLAYER</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RATING</div>
            </div>

            {/* 4th+ rows */}
            {rankings.length > 3 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {pagedRankings.filter((_, idx) => page === 0 ? idx >= 3 : true).map((rank, idx) => {
                    const realIdx = page === 0 ? idx + 3 : idx;
                    const rankNum = page * PAGE_SIZE + (page === 0 ? realIdx : idx) + 1;
                    const isMe = rank.memberId === myUserId;
                    return (
                      <div
                        key={rank.memberId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: isMe ? '10px 12px 10px 10px' : '10px 12px',
                          borderRadius: 12,
                          backgroundColor: isMe ? 'color-mix(in srgb, var(--th-primary) 12%, transparent)' : V('--th-card'),
                          border: `1px solid ${isMe ? 'var(--th-primary)' : 'var(--th-border)'}`,
                          borderLeft: isMe ? '4px solid var(--th-primary)' : `1px solid var(--th-border)`,
                          boxShadow: isMe ? '0 2px 12px color-mix(in srgb, var(--th-primary) 20%, transparent)' : 'none',
                        }}
                      >
                        <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: isMe ? 'var(--th-primary)' : V('--th-text-sub'), textAlign: 'center' }}>{rankNum}</div>
                        <InitialAvatar nickname={rank.nickname} profileImage={rank.profileImage} size={28} fontSize={11} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rank.nickname}
                          </div>
                          {isMe && <div style={{ fontSize: 10, color: 'var(--th-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>YOU</div>}
                        </div>
                        {isHost && (
                          <button onClick={() => handleOpenRatingEdit(rank)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                            <Pencil style={{ width: 13, height: 13, color: V('--th-text-sub') }} />
                          </button>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--th-primary)', flexShrink: 0 }}>
                          {Math.round(rank.rating).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        backgroundColor: V('--th-card'), color: page === 0 ? V('--th-text-sub') : V('--th-text'),
                        border: `1px solid var(--th-border)`, cursor: page === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronLeft style={{ width: 14, height: 14 }} />
                      PREVIOUS
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        backgroundColor: V('--th-card'), color: page >= totalPages - 1 ? V('--th-text-sub') : V('--th-text'),
                        border: `1px solid var(--th-border)`, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      NEXT
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      </div>

      {/* Bottom Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, var(--th-bg) 70%, transparent)' }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 32px' }}>
          <button
            onClick={() => navigate(`/invite/${roomId}`)}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 4px 16px rgba(107, 92, 231, 0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
              {t('ranking', 'startGame')}
            </span>
          </button>
        </div>
      </div>

      {/* Rating Edit Modal */}
      {ratingEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ borderRadius: 16, padding: 24, margin: '0 16px', width: '100%', maxWidth: 320, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: V('--th-text'), marginBottom: 4 }}>{t('ranking', 'editRating')}</h3>
            <p style={{ fontSize: 13, color: V('--th-primary'), marginBottom: 4 }}>{ratingEditModal.nickname}</p>
            <p style={{ fontSize: 12, color: V('--th-text-sub'), marginBottom: 16 }}>{t('ranking', 'editRatingDesc')}</p>
            <input
              type="number"
              value={ratingEditValue}
              onChange={(e) => setRatingEditValue(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                fontSize: 18, fontWeight: 700, outline: 'none', marginBottom: 16,
                backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`, color: V('--th-text'),
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRatingEditModal(null)} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}>
                {t('common', 'cancel')}
              </button>
              <button onClick={handleUpdateRating} disabled={isRatingEditSaving} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-primary'), color: '#fff', border: 'none', cursor: 'pointer', opacity: isRatingEditSaving ? 0.5 : 1 }}>
                {isRatingEditSaving ? t('ranking', 'saving') : t('ranking', 'save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;
