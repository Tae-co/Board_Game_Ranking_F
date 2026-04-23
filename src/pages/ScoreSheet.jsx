import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { SCORE_SCHEMAS } from '../scoreSheets/schemas/index';
import { getAllCategories, cl } from '../scoreSheets/shared/scoreUtils';
import { ScienceModal } from '../scoreSheets/shared/ScoreCell';
import RankInputTable from '../scoreSheets/components/RankInputTable';

const ScoreSheet = () => {
  const { boardGameId: boardGameIdStr } = useParams();
  const boardGameId = Number(boardGameIdStr);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const { players = [], roomId, gameName = '', editMatchId = null, savedScores = null, readOnly = false, backTo = null } = location.state || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scienceModal, setScienceModal] = useState(null);
  const [duelWinnerId, setDuelWinnerId] = useState(null);
  const [duelWinCondition, setDuelWinCondition] = useState(null);
  const [duelFellowshipId, setDuelFellowshipId] = useState(() => players[0]?.memberId ?? null);

  // 순위 직접 입력 모드 (supportsRankMode: true 게임 또는 스키마 없는 게임)
  const [rankMode, setRankMode] = useState(false);
  const [rankInputs, setRankInputs] = useState({});

  // 라운드 기반 게임(UNO, 루미큐브)의 totals를 테이블에서 받아옴
  const [roundTotals, setRoundTotals] = useState({});

  const currentSchema = useMemo(() => {
    const normalizedGameName = gameName.toLowerCase();
    return SCORE_SCHEMAS[boardGameId]
      ?? (gameName && Object.values(SCORE_SCHEMAS).find(s =>
        normalizedGameName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(normalizedGameName)
      ))
      ?? (players.length ? { name: gameName || '게임', type: 'generic' } : null);
  }, [boardGameId, gameName, players.length]);

  const initScores = (schema, playerList) => {
    const cats = getAllCategories(schema);
    const init = {};
    cats.forEach(cat => {
      init[cat.key] = {};
      playerList.forEach(p => { init[cat.key][p.memberId] = cat.type === 'exclusive_check' ? false : ""; });
    });
    return init;
  };

  const handleCatanCheck = (catKey, memberId) => {
    setScores(prev => {
      const wasChecked = prev[catKey]?.[memberId];
      const newChecks = {};
      players.forEach(p => { newChecks[p.memberId] = p.memberId === memberId ? !wasChecked : false; });
      return { ...prev, [catKey]: newChecks };
    });
  };

  const [scores, setScores] = useState(() => {
    if (!currentSchema) return {};
    if (savedScores) return savedScores;
    return initScores(currentSchema, players);
  });

  const allCategories = useMemo(() => (
    currentSchema ? getAllCategories(currentSchema) : []
  ), [currentSchema]);

  const handleChange = (catKey, memberId, value) => {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [memberId]: value } }));
  };

  const isRoundBased = currentSchema?.type === 'uno' || currentSchema?.type === 'rummikub' || currentSchema?.type === 'dicethrone';
  const lowestWins = !!currentSchema?.lowestWins;

  const totals = useMemo(() => {
    // 라운드 기반 게임은 테이블 컴포넌트에서 받은 roundTotals 사용
    if (isRoundBased) return roundTotals;
    const t = {};
    players.forEach(p => {
      if (currentSchema?.type === 'catan') {
        t[p.memberId] = currentSchema.categories.reduce((sum, cat) => {
          const v = scores[cat.key]?.[p.memberId];
          if (cat.type === 'exclusive_check') return sum + (v ? cat.bonus : 0);
          return sum + (Number(v) || 0) * (cat.multiplier || 1);
        }, 0);
      } else {
        t[p.memberId] = allCategories.reduce((sum, cat) => {
          const v = Number(scores[cat.key]?.[p.memberId]) || 0;
          return cat.negative && !cat.allowNegative ? sum - Math.abs(v) : sum + v;
        }, 0);
      }
    });
    return t;
  }, [scores, players, allCategories, currentSchema, isRoundBased, roundTotals]);

  // lowestWins(루미큐브)는 낮은 점수가 1위
  const winnerId = useMemo(() => {
    if (!players.length) return null;
    return players.reduce((a, b) => {
      const sa = totals[a.memberId] ?? 0;
      const sb = totals[b.memberId] ?? 0;
      return lowestWins ? (sa <= sb ? a : b) : (sa >= sb ? a : b);
    }, players[0])?.memberId;
  }, [totals, players, lowestWins]);

  const calcPlacements = () => {
    const entries = players.map(p => ({ memberId: p.memberId, score: totals[p.memberId] }));
    // lowestWins: 낮은 점수가 1위
    const sorted = [...entries].sort((a, b) => lowestWins ? a.score - b.score : b.score - a.score);
    const placements = {};
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
      } else {
        placements[sorted[i].memberId] = currentRank;
      }
      currentRank++;
    }
    return placements;
  };

  const handleSubmit = async () => {
    let participants;
    if (currentSchema?.type === "duel" || currentSchema?.type === "splendorduel") {
      if (!duelWinnerId) { alert(t('scoreSheet', 'winnerRequired')); return; }
      const allCats = getAllCategories(currentSchema);
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: p.memberId === duelWinnerId ? 1 : 2,
        scoresJson: JSON.stringify({
          ...Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId] ?? 0])),
          win_condition: duelWinCondition,
          won: p.memberId === duelWinnerId,
        }),
      }));
    } else if (rankMode) {
      // 순위 직접 입력 모드: rankInputs에서 placement 사용
      const allFilled = players.every(p => rankInputs[p.memberId]);
      if (!allFilled) { alert('모든 플레이어의 순위를 선택해주세요.'); return; }
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: rankInputs[p.memberId],
        scoresJson: null,
      }));
    } else if (isRoundBased) {
      // 라운드 기반: roundTotals로 placement 계산, 전체 게임 데이터 scoresJson 전달
      const placements = calcPlacements();
      const roundData = scores["_data"]?.["all"] || null;
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: roundData,
      }));
    } else {
      const placements = calcPlacements();
      const allCats = getAllCategories(currentSchema);
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: JSON.stringify(
          Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId]]))
        ),
      }));
    }
    try {
      setIsSubmitting(true);
      const res = editMatchId
        ? await api.put(`/matches/${editMatchId}`, { boardGameId, roomId, participants })
        : await api.post('/matches', { boardGameId, roomId, participants });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rankings', String(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['matches', String(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['rankings', Number(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['matches', Number(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
      navigate(`/ranking/${roomId}`, { state: { matchResult: res.data }, replace: true });
    } catch (err) {
      alert(t('scoreSheet', 'saveFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  if (!players.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--th-bg)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
        <p style={{ color: "var(--th-text-sub)", marginBottom: 24 }}>{t('scoreSheet', 'wrongAccess')}</p>
        <button onClick={handleBack} style={{ padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-primary)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 700 }}>
          {t('scoreSheet', 'goBack')}
        </button>
      </div>
    );
  }

  const TableComponent = currentSchema?.TableComponent;
  const winnerNickname = players.find(p => p.memberId === winnerId)?.nickname;

  return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", background: "var(--th-bg)", minHeight: "100vh", paddingBottom: 100, maxWidth: '375px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--th-bg)", padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={handleBack} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--th-primary)" }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--th-text)" }}>{`${currentSchema.name} ${t('scoreSheet', 'scoreBoard')}`}</h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--th-text-sub)" }}>{t('scoreSheet', 'enterScores')}</p>
        </div>
      </div>

      {/* 순위 입력 모드 토글 (supportsRankMode 게임만) */}
      {currentSchema?.supportsRankMode && !readOnly && (
        <div style={{ margin: "0 16px 12px", display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid var(--th-border)" }}>
          <button
            onClick={() => { setRankMode(false); setRankInputs({}); }}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: !rankMode ? "var(--th-primary)" : "var(--th-card)",
              color: !rankMode ? "#fff" : "var(--th-text-sub)",
            }}
          >
            {t('scoreSheet', 'scoreInput')}
          </button>
          <button
            onClick={() => setRankMode(true)}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: rankMode ? "var(--th-primary)" : "var(--th-card)",
              color: rankMode ? "#fff" : "var(--th-text-sub)",
            }}
          >
            {t('scoreSheet', 'rankInput')}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ margin: "0 16px", background: "var(--th-card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--th-border)" }}>
        {(rankMode || !TableComponent) ? (
          <RankInputTable
            players={players}
            rankInputs={rankInputs}
            onChange={(memberId, placement) => setRankInputs(prev => ({ ...prev, [memberId]: placement }))}
            readOnly={readOnly}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <TableComponent
              schema={currentSchema}
              players={players}
              scores={scores}
              totals={totals}
              winnerId={winnerId}
              handleChange={handleChange}
              handleCatanCheck={handleCatanCheck}
              setScienceModal={setScienceModal}
              duelWinCondition={duelWinCondition}
              setDuelWinCondition={setDuelWinCondition}
              duelWinnerId={duelWinnerId}
              setDuelWinnerId={setDuelWinnerId}
              duelFellowshipId={duelFellowshipId}
              setDuelFellowshipId={setDuelFellowshipId}
              onTotalsChange={setRoundTotals}
              t={t}
              lang={lang}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>

      {/* 우승자 배너 */}
      {currentSchema?.type === "duel" ? (
        duelWinnerId && (() => {
          const fellowshipPlayer = players.find(p => p.memberId === duelFellowshipId) || players[0];
          const winnerIsFellowship = duelWinnerId === fellowshipPlayer.memberId;
          const teamColor = winnerIsFellowship ? "#16a34a" : "#b91c1c";
          const teamEmoji = winnerIsFellowship ? "🌿" : "👁️";
          const teamName = winnerIsFellowship ? t('scoreSheet', 'fellowshipTeam') : t('scoreSheet', 'sauronTeam');
          const winnerNick = players.find(p => p.memberId === duelWinnerId)?.nickname;
          return (
            <div style={{ margin: "16px 16px 0", background: teamColor, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <span style={{ fontSize: 28 }}>{teamEmoji}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>{`${teamName} ${t('scoreSheet', 'duelWins')}`}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{winnerNick}</div>
                {duelWinCondition && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{cl(currentSchema.winConditions.find(w => w.key === duelWinCondition), lang)}</div>}
              </div>
            </div>
          );
        })()
      ) : currentSchema?.type === "splendorduel" ? (
        duelWinnerId && (() => {
          const winnerNick = players.find(p => p.memberId === duelWinnerId)?.nickname;
          const wc = currentSchema.winConditions.find(w => w.key === duelWinCondition);
          return (
            <div style={{ margin: "16px 16px 0", background: "var(--th-primary)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <span style={{ fontSize: 28 }}>💎</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>{`${winnerNick} ${t('scoreSheet', 'duelWins')}`}</div>
                {wc && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{wc.icon} {cl(wc, lang)}</div>}
              </div>
            </div>
          );
        })()
      ) : (
        Object.values(totals).some(v => v > 0) && (
          <div style={{ margin: "16px 16px 0", background: "var(--th-primary)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <span style={{ fontSize: 28 }}>👑</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>{`${winnerNickname} ${t('scoreSheet', 'victory')}`}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{`${totals[winnerId]}${t('scoreSheet', 'firstPlace')}`}</div>
            </div>
          </div>
        )
      )}

      {/* Bottom Fixed Button */}
      {!readOnly && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 16, background: "var(--th-bg)", maxWidth: 375, margin: "0 auto" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 50, border: "none",
              background: isSubmitting ? "var(--th-border)" : "var(--th-primary)",
              color: "#fff", fontSize: 14, fontWeight: 900, cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? t('scoreSheet', 'saving') : editMatchId ? t('scoreSheet', 'submitEdit') : t('scoreSheet', 'submit')}
          </button>
        </div>
      )}

      {/* 과학 모달 */}
      {scienceModal && (
        <ScienceModal
          onConfirm={(score) => { handleChange("science", scienceModal.memberId, score); setScienceModal(null); }}
          onClose={() => setScienceModal(null)}
        />
      )}
    </div>
  );
};

export default ScoreSheet;
