import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TierBadge, TIERS } from '../components/TierBadge';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const getRankStyle = (index) => {
  if (index === 0) return { color: '#FFD700', bgColor: '#FFD700' };
  if (index === 1) return { color: '#C0C0C0', bgColor: '#C0C0C0' };
  if (index === 2) return { color: '#CD7F32', bgColor: '#CD7F32' };
  return { color: 'var(--th-text-sub)', bgColor: 'var(--th-border)' };
};

const RankBadge = ({ index }) => {
  const rankStyle = getRankStyle(index);
  return (
    <motion.div
      className="w-8 h-8 rounded-full flex items-center justify-center font-bold relative flex-shrink-0"
      style={{
        background: index < 3
          ? `linear-gradient(135deg, ${rankStyle.bgColor}, ${rankStyle.color}80)`
          : 'var(--th-border)',
        color: index < 3 ? '#FFFFFF' : 'var(--th-text)',
        boxShadow: index < 3 ? `0 4px 12px ${rankStyle.color}60` : 'none',
        fontSize: '13px',
      }}
      animate={index < 3 ? {
        boxShadow: [
          `0 4px 12px ${rankStyle.color}60`,
          `0 6px 20px ${rankStyle.color}80`,
          `0 4px 12px ${rankStyle.color}60`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {index + 1}
      {index === 0 && (
        <div className="absolute -top-1 -right-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' }}>
          <Crown className="w-3 h-3" style={{ color: '#FFD700', fill: '#FFD700' }} />
        </div>
      )}
    </motion.div>
  );
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState('group');
  const [editModal, setEditModal] = useState(null);
  const myNickname = localStorage.getItem('nickname');
  const myUserId = Number(localStorage.getItem('userId'));

  const ratingChangeMap = matchResult
    ? Object.fromEntries(matchResult.map(r => [r.memberId, r.ratingChange]))
    : {};

  const { data: roomMembers = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
  });

  const isHost = roomMembers.find(m => m.memberId === myUserId)?.isHost ?? false;

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/rankings`);
      return res.data || [];
    },
    enabled: activeTab === 'group',
    staleTime: 1000 * 60 * 3,
  });

  const { data: matches = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/matches`);
      return res.data || [];
    },
    enabled: activeTab === 'matches',
  });

  const getWinRate = (winCount, loseCount) => {
    const total = winCount + loseCount;
    if (total === 0) return 0;
    return Math.round((winCount / total) * 100);
  };

  const getTier = (points) => {
    if (points >= TIERS.diamond.minPoints) return TIERS.diamond;
    if (points >= TIERS.platinum.minPoints) return TIERS.platinum;
    if (points >= TIERS.gold.minPoints) return TIERS.gold;
    if (points >= TIERS.silver.minPoints) return TIERS.silver;
    return TIERS.bronze;
  };

  const handleUpdateMatch = async () => {
    const placements = editModal.participants.map(p => p.placement);
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      alert('순위가 중복되었습니다. 모든 참여자의 순위를 다르게 설정해주세요.');
      return;
    }
    const isUnchanged = editModal.participants.every(p => p.placement === p.originalPlacement);
    if (isUnchanged) {
      alert('변경된 순위가 없습니다.');
      return;
    }
    try {
      await api.put(`/matches/${editModal.matchId}`, {
        boardGameId: editModal.boardGameId,
        roomId: Number(roomId),
        participants: editModal.participants.map(p => ({
          memberId: p.memberId,
          placement: p.placement,
        })),
      });
      setEditModal(null);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch {
      alert('수정에 실패했습니다.');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/matches/${matchId}?requesterId=${myUserId}`);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const isLoading = activeTab === 'matches' ? isMatchesLoading : isRankingLoading;

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center sticky top-0 z-10" style={{ backgroundColor: 'var(--th-bg)' }}>
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--th-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Trophy className="w-6 h-6 mr-2" style={{ color: 'var(--th-primary)' }} />
        <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{t('ranking', 'title')}</h1>
      </div>

      {/* Tab Toggle */}
      <div className="px-6 mb-4">
        <div className="flex rounded-full p-1" style={{ backgroundColor: 'var(--th-card)', border: '1px solid var(--th-border)' }}>
          {[
            { key: 'group', label: t('ranking', 'groupTab') },
            { key: 'matches', label: '매치기록' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-full transition-all text-xs"
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--th-primary)' : 'transparent',
                color: activeTab === tab.key ? '#FFFFFF' : 'var(--th-text-sub)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div className="px-6 mb-4">
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-primary)' }}>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--th-primary)' }}>🎮 {t('ranking', 'matchResult')}</p>
            <div className="flex flex-wrap gap-2">
              {matchResult.map((r) => {
                const change = r.ratingChange;
                const isPos = change > 0;
                return (
                  <div
                    key={r.memberId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--th-bg)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--th-text)' }}>{r.nickname}</span>
                    <span className="text-sm font-bold" style={{ color: isPos ? '#16a34a' : '#dc2626' }}>
                      {isPos ? '+' : ''}{Math.round(change)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⏳</div>
            <p style={{ color: 'var(--th-text-sub)' }}>{t('common', 'loading')}</p>
          </div>
        ) : activeTab === 'matches' ? (
          matches.length === 0 ? (
            <div className="rounded-2xl p-10 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
              <div className="text-5xl mb-4">🎲</div>
              <p style={{ color: 'var(--th-text)' }}>매치 기록이 없습니다</p>
              <p className="text-sm mt-2" style={{ color: 'var(--th-text-sub)' }}>게임을 플레이하면 기록이 쌓여요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--th-text-sub)' }}>{match.gameName}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--th-text)' }}>{formatDate(match.playedAt)}</p>
                    </div>
                    {isHost && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditModal({ matchId: match.matchId, boardGameId: match.boardGameId, participants: match.participants.map(p => ({ ...p, originalPlacement: p.placement })) })}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-primary)', border: '1px solid var(--th-primary)' }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(match.matchId)}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: 'var(--th-bg)', color: '#dc2626', border: '1px solid #dc2626' }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {match.participants.map((p) => (
                      <div key={p.memberId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor: p.placement === 1 ? '#FFD700' : p.placement === 2 ? '#C0C0C0' : p.placement === 3 ? '#CD7F32' : 'var(--th-border)',
                              color: '#FFFFFF',
                            }}
                          >
                            {p.placement}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--th-text)' }}>{p.nickname}</span>
                        </div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: p.ratingChange > 0 ? '#16a34a' : '#dc2626' }}
                        >
                          {p.ratingChange > 0 ? '+' : ''}{Math.round(p.ratingChange)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : rankings.length === 0 ? (
          <div className="rounded-2xl p-10 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-lg" style={{ color: 'var(--th-text)' }}>{t('ranking', 'noRecord')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--th-text-sub)' }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((rank, index) => {
              const isMe = rank.nickname === myNickname;
              const tier = getTier(Math.round(rank.rating));
              const change = ratingChangeMap[rank.memberId];
              const winRate = getWinRate(rank.winCount, rank.loseCount);

              return (
                <motion.div
                  key={rank.memberId}
                  className="rounded-xl px-3 py-2.5 border flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--th-card)',
                    borderColor: isMe ? 'var(--th-primary)' : 'var(--th-border)',
                    borderWidth: isMe ? '2px' : '1px',
                    boxShadow: isMe ? '0 4px 12px rgba(var(--th-primary-rgb), 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  {/* 순위 뱃지 */}
                  <RankBadge index={index} />

                  {/* 티어 뱃지 */}
                  <TierBadge tier={tier} size="sm" />

                  {/* 닉네임 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--th-text)' }}>{rank.nickname}</p>
                      {isMe && (
                        <motion.span
                          className="px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--th-primary), var(--th-primary-light))', color: '#FFFFFF', fontSize: '10px' }}
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ME
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* W / L / WR */}
                  <div className="flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--th-text-sub)', fontSize: '10px' }}>
                    <span>W<span className="font-bold ml-0.5" style={{ color: 'var(--th-text)' }}>{rank.winCount}</span></span>
                    <span>L<span className="font-bold ml-0.5" style={{ color: 'var(--th-text)' }}>{rank.loseCount}</span></span>
                    <span>WR<span className="font-bold ml-0.5" style={{ color: winRate >= 60 ? 'var(--th-primary)' : 'var(--th-text)' }}>{winRate}%</span></span>
                  </div>

                  {/* LP */}
                  <div className="text-right flex-shrink-0" style={{ minWidth: '36px' }}>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ background: 'linear-gradient(135deg, var(--th-primary), var(--th-primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                    >
                      {Math.round(rank.rating)}
                    </p>
                    {change !== undefined ? (
                      <p className="font-bold leading-tight" style={{ color: change > 0 ? '#16a34a' : '#dc2626', fontSize: '10px' }}>
                        {change > 0 ? '+' : ''}{Math.round(change)}
                      </p>
                    ) : (
                      <p style={{ color: 'var(--th-text-sub)', fontSize: '10px' }}>&nbsp;</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 mt-6 space-y-3">
        <motion.button
          onClick={() => navigate(`/invite/${roomId}`)}
          className="w-full py-3 rounded-full font-bold border-2"
          style={{ backgroundColor: 'transparent', color: 'var(--th-primary)', borderColor: 'var(--th-primary)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          게임 로비
        </motion.button>
        <motion.button
          onClick={() => navigate(`/games/${roomId}`)}
          className="w-full py-3 rounded-full font-bold"
          style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(var(--th-primary-rgb), 0.3)' }}
          whileTap={{ scale: 0.98 }}
        >
          게임 시작
        </motion.button>
      </div>

      {/* Edit Match Modal */}
      {editModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}
        >
          <div className="rounded-2xl p-6 w-full" style={{ backgroundColor: 'var(--th-card)', maxWidth: '340px' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--th-text)' }}>매치 수정</h3>
            <div className="space-y-3 mb-6">
              {editModal.participants.map((p) => {
                const total = editModal.participants.length;
                return (
                  <div key={p.memberId} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--th-text)' }}>{p.nickname}</span>
                    <select
                      value={p.placement}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        participants: prev.participants.map(pp =>
                          pp.memberId === p.memberId
                            ? { ...pp, placement: Number(e.target.value) }
                            : pp
                        ),
                      }))}
                      className="rounded-xl border text-sm px-2 py-1.5 focus:outline-none"
                      style={{ borderColor: 'var(--th-border)', backgroundColor: 'var(--th-bg)', color: 'var(--th-text)', minWidth: '72px' }}
                    >
                      {Array.from({ length: total }, (_, i) => i + 1).map(rank => (
                        <option key={rank} value={rank}>{rank}위</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2 rounded-full text-sm border"
                style={{ borderColor: 'var(--th-border)', color: 'var(--th-text-sub)', backgroundColor: 'var(--th-card)' }}
              >
                취소
              </button>
              <button
                onClick={handleUpdateMatch}
                className="flex-1 py-2 rounded-full text-sm"
                style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;
