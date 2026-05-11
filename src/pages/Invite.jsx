import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePresence } from '../hooks/usePresence';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Share2 } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { RankRowSkeleton } from '../components/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoom, getRoomMembers, getRoomRankings, getRoomMatches, leaveRoom, deleteRoom, kickRoomMember, updateRoomName, updateMemberRating } from '../api/services/rooms';
import { getGames } from '../api/services/games';
import { deleteMatch } from '../api/services/matches';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { getSelectedCommunity } from '../utils/storage';
import { getAuthUserId, getNickname } from '../auth/storage';
import { REGION_TIMEZONE } from '../constants/regions';
import RoomSettingsOverlay from '../components/invite/RoomSettingsOverlay';
import GameCard from '../components/invite/GameCard';
import StatsCard from '../components/ranking/StatsCard';
import MatchCard from '../components/ranking/MatchCard';
import PodiumRanking from '../components/ranking/PodiumRanking';
import RankingTable from '../components/ranking/RankingTable';
import RatingEditModal from '../components/ranking/RatingEditModal';

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

const Invite = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const userId = Number(getAuthUserId());
  const matchResult = location.state?.matchResult || null;
  const communityTimezone = REGION_TIMEZONE[getSelectedCommunity()?.region] || undefined;

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(location.state?.matchPage ?? 0);
  const PAGE_SIZE = 7;
  const MATCH_PAGE_SIZE = 5;
  const touchStartX = useRef(null);

  const { data: roomInfo = {}, refetch: refetchRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    staleTime: 1000 * 60 * 10,
    initialData: () => {
      const cachedRooms = queryClient.getQueryData(['rooms', String(userId)]);
      const found = cachedRooms?.find(r => String(r.roomId) === String(roomId));
      return found ?? undefined;
    },
  });

  const roomName = roomInfo.roomName || '';

  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: () => getRoomMembers(roomId),
    staleTime: 1000 * 60 * 2,
  });

  const onlineIds = usePresence(userId, roomId);

  useEffect(() => {
    if (membersLoading || onlineIds.size === 0) return;
    const memberIdSet = new Set(members.map(m => m.memberId));
    if ([...onlineIds].some(id => !memberIdSet.has(id))) refetchMembers();
  }, [onlineIds, members, membersLoading, refetchMembers]);

  const isHost = members.find(m => m.memberId === userId)?.isHost ?? false;

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: getGames,
    enabled: !!roomInfo.boardGameId,
    staleTime: 1000 * 60 * 30,
  });
  const gameInfo = games.find(g => g.id === roomInfo.boardGameId) ?? null;

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: () => getRoomRankings(roomId),
    staleTime: 1000 * 60 * 3,
  });

  const { data: allMatchesRaw = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: () => getRoomMatches(roomId),
    staleTime: 1000 * 60 * 1,
  });
  const allMatches = roomInfo.boardGameId
    ? allMatchesRaw.filter(m => m.boardGameId === roomInfo.boardGameId)
    : allMatchesRaw;
  const pagedMatches = useMemo(
    () => allMatches.slice(page * MATCH_PAGE_SIZE, (page + 1) * MATCH_PAGE_SIZE),
    [allMatches, page],
  );
  const totalMatchPages = useMemo(() => Math.ceil(allMatches.length / MATCH_PAGE_SIZE), [allMatches.length]);

  const myRank = useMemo(() => rankings.find(r => r.memberId === userId), [rankings, userId]);
  const myRankPosition = useMemo(() => {
    const idx = rankings.findIndex(r => r.memberId === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [rankings, userId]);
  const myWinRate = useMemo(() => {
    if (!myRank || myRank.winCount + myRank.loseCount === 0) return 0;
    return Math.round(myRank.winCount / (myRank.winCount + myRank.loseCount) * 100);
  }, [myRank]);

  const myStreak = useMemo(() => {
    const myMatches = allMatches
      .filter(m => m.participants?.some(p => p.memberId === userId))
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
    if (myMatches.length === 0) return null;
    const first = myMatches[0].participants.find(p => p.memberId === userId);
    const isWin = first?.placement === 1;
    let count = 1;
    for (let i = 1; i < myMatches.length; i++) {
      const p = myMatches[i].participants.find(p => p.memberId === userId);
      if ((p?.placement === 1) === isWin) count++;
      else break;
    }
    return { count, isWin };
  }, [allMatches, userId]);

  const mergedPlayers = useMemo(() => {
    const memberMap = new Map(members.map(m => [m.memberId, m]));
    const rankedIds = new Set(rankings.map(r => r.memberId));
    // rankings 순서(rating 내림차순)를 유지
    const ranked = rankings
      .map((r, i) => ({ ...memberMap.get(r.memberId), ...r, rankPosition: i + 1 }))
      .filter(r => r.memberId != null);
    const unranked = members
      .filter(m => !rankedIds.has(m.memberId))
      .map(m => ({ ...m, hasRank: false }));
    return [...ranked, ...unranked];
  }, [members, rankings]);

  const pagedRankings = useMemo(
    () => mergedPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [mergedPlayers, page]
  );
  const totalPages = useMemo(() => Math.ceil(mergedPlayers.length / PAGE_SIZE), [mergedPlayers.length]);

  const minPlayers = gameInfo?.minPlayers ?? 2;
  const maxPlayers = gameInfo?.maxPlayers ?? 99;
  const canStart = selectedPlayers.size >= minPlayers && selectedPlayers.size <= maxPlayers;
  const isLoading = activeTab === 'matches' ? isMatchesLoading : (membersLoading || isRankingLoading);

  const togglePlayer = (memberId) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setPage(0); };

  const handleStartGame = () => {
    if (!canStart) return;
    navigate(`/score-sheet/${roomInfo.boardGameId}`, {
      state: {
        roomId,
        gameName: gameInfo?.name || '',
        players: mergedPlayers.filter(p => selectedPlayers.has(p.memberId)),
      },
    });
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm(t('invite', 'leaveConfirm'))) return;
    try {
      await leaveRoom(roomId, userId);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
      navigate('/lobby');
    } catch { alert(t('invite', 'leaveFailed')); }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('invite', 'deleteConfirm'))) return;
    try {
      await deleteRoom(roomId);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
      navigate('/lobby');
    } catch { alert(t('invite', 'deleteFailed')); }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`${member.nickname}${t('invite', 'kickConfirm')}`)) return;
    try {
      await kickRoomMember(roomId, member.memberId);
      refetchMembers();
    } catch { alert(t('invite', 'kickFailed')); }
  };

  const handleSaveSettings = async () => {
    const trimmed = editRoomName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateRoomName(roomId, trimmed);
      await refetchRoom();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setShowSettings(false);
    } catch { alert('방 이름 변경에 실패했습니다.'); }
    setSaving(false);
  };

  const openSettings = () => { setEditRoomName(roomName); setShowSettings(true); };

  const nativeShare = (title, text) => {
    if (navigator.share) navigator.share({ title, text }).catch(() => {});
  };

  const shareMyRank = useCallback(() => {
    if (!myRank || !myRankPosition) return;
    const gameName = gameInfo?.name || roomInfo?.roomName || '보드게임';
    const nickname = getNickname() || myRank.nickname;
    nativeShare(
      `🏆 ${nickname}의 ${gameName} 랭킹`,
      `${myRankPosition}위 · 레이팅 ${Math.round(myRank.rating)} · 승률 ${myWinRate}% (${myRank.winCount}승 ${myRank.loseCount}패)\n\nYadaRank에서 보드게임 랭킹 관리 중 👉 yadarank.com`,
    );
  }, [myRank, myRankPosition, gameInfo, roomInfo, myWinRate]);

  const shareMatchResult = useCallback(() => {
    if (!matchResult) return;
    const gameName = gameInfo?.name || roomInfo?.roomName || '보드게임';
    const lines = [...matchResult]
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .map(r => `${r.nickname} ${r.ratingChange >= 0 ? '+' : ''}${Math.round(r.ratingChange)}`)
      .join(' · ');
    nativeShare(
      `🎮 ${gameName} 한판 결과!`,
      `${lines}\n\nYadaRank에서 보드게임 랭킹을 기록 중이에요 👉 yadarank.com`,
    );
  }, [matchResult, gameInfo, roomInfo]);

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await updateMemberRating(roomId, ratingEditModal.memberId, { rating: val });
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
        savedScores, backTo: `/invite/${roomId}`,
        backState: { activeTab: 'matches', matchPage: page },
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId, page]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteMatch(matchId);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch { alert('삭제에 실패했습니다.'); }
  }, [queryClient, refetchMatches, roomId]);

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: V('--th-nav-bg'),
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <div style={{
          maxWidth: 390, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
        }}>
          <button
            onClick={() => navigate('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
          >
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>
            Group Lobby
          </h1>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Board Game Card */}
        {roomInfo.boardGameId && <GameCard gameInfo={gameInfo} />}

        {/* Stats Card */}
        <StatsCard
          myRank={myRank}
          myWinRate={myWinRate}
          myStreak={myStreak}
          streakLoading={isMatchesLoading}
          myRankPosition={myRankPosition}
          rankLoading={isRankingLoading}
          t={t}
        />

        {/* Players section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>
              {t('invite', 'members')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {myRank && (
                <button
                  onClick={shareMyRank}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-text-sub'), display: 'flex', alignItems: 'center' }}
                >
                  <Share2 style={{ width: 18, height: 18 }} />
                </button>
              )}
              <button
                onClick={isHost ? openSettings : undefined}
                style={{
                  background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center',
                  cursor: isHost ? 'pointer' : 'default',
                  color: isHost ? V('--th-text-sub') : 'color-mix(in srgb, var(--th-text-sub) 40%, transparent)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', borderRadius: 24, padding: 4, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
              {[
                { key: 'group', label: t('ranking', 'groupTab') },
                { key: 'matches', label: t('ranking', 'matchesTab') },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
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
            <div style={{ marginBottom: 12 }}>
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
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {[0, 1, 2, 3].map(i => <RankRowSkeleton key={i} />)}
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
                <>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                      if (touchStartX.current === null) return;
                      const delta = touchStartX.current - e.changedTouches[0].clientX;
                      touchStartX.current = null;
                      if (delta > 50 && page < totalMatchPages - 1) setPage(p => p + 1);
                      else if (delta < -50 && page > 0) setPage(p => p - 1);
                    }}
                  >
                    {pagedMatches.map((match) => (
                      <MatchCard
                        key={match.matchId}
                        match={match}
                        myUserId={userId}
                        communityTimezone={communityTimezone}
                        isHost={isHost}
                        onView={handleViewMatch}
                        onEdit={handleEditMatch}
                        onDelete={handleDeleteMatch}
                      />
                    ))}
                  </div>
                  {totalMatchPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'), color: page === 0 ? V('--th-text-sub') : V('--th-text'), cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        ‹
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 700, color: V('--th-text-sub') }}>{page + 1} / {totalMatchPages}</span>
                      <button
                        onClick={() => setPage(p => Math.min(totalMatchPages - 1, p + 1))}
                        disabled={page >= totalMatchPages - 1}
                        style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'), color: page >= totalMatchPages - 1 ? V('--th-text-sub') : V('--th-text'), cursor: page >= totalMatchPages - 1 ? 'not-allowed' : 'pointer' }}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : mergedPlayers.length === 0 ? (
            <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
              <p style={{ fontSize: 17, color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
              <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
            </div>
          ) : (
            <>
              {rankings.length >= 1 && (
                <PodiumRanking rankings={rankings} myUserId={userId} />
              )}
              <RankingTable
                pagedRankings={pagedRankings}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                myUserId={userId}
                isHost={isHost}
                onEditRating={handleOpenRatingEdit}
                PAGE_SIZE={PAGE_SIZE}
                selectedPlayers={selectedPlayers}
                onToggle={togglePlayer}
              />
            </>
          )}
        </div>
      </div>

      {/* Sticky Start Game Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '10px 20px 28px' }}>
          {selectedPlayers.size > maxPlayers && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', margin: '0 0 6px' }}>
              {t('gameSelect', 'maxPlayersError').replace('{n}', maxPlayers)}
            </p>
          )}
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px',
              cursor: canStart ? 'pointer' : 'not-allowed',
              background: canStart
                ? 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)'
                : V('--th-border'),
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: canStart ? '0 4px 16px rgba(107, 92, 231, 0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Play style={{ color: '#FFFFFF', width: 18, height: 18, fill: '#FFFFFF' }} />
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
              {selectedPlayers.size > 0
                ? `${selectedPlayers.size}${t('gameSelect', 'startButton')}`
                : t('invite', 'startPlaceholder')}
            </span>
          </button>
        </div>
      </div>

      {showSettings && (
        <RoomSettingsOverlay
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          onDeleteRoom={handleDeleteRoom}
          editRoomName={editRoomName}
          setEditRoomName={setEditRoomName}
          members={members}
          userId={userId}
          saving={saving}
          onKickMember={handleKickMember}
          navigate={navigate}
          t={t}
        />
      )}

      {ratingEditModal && (
        <RatingEditModal
          ratingEditModal={ratingEditModal}
          onClose={() => setRatingEditModal(null)}
          ratingEditValue={ratingEditValue}
          setRatingEditValue={setRatingEditValue}
          onSave={handleUpdateRating}
          isSaving={isRatingEditSaving}
          t={t}
        />
      )}
    </div>
  );
};

export default Invite;
