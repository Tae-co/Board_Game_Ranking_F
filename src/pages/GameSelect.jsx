import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const GameSelect = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [games, setGames] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    // API 통신을 가정하고 임시 데이터를 세팅할게
    const fetchData = async () => {
      try {
        // 1. 전체 보드게임 리스트 불러오기
        const gameRes = await api.get('/games');
        setGames(gameRes.data || []);

        // 2. 현재 방의 멤버 리스트 불러오기
        const roomRes = await api.get(`/rooms/${roomId}/members`);
        setMembers(roomRes.data || []);
      } catch (err) {
        console.error('데이터를 불러오는데 실패했습니다.', err);
      }
    };
    fetchData();
  }, [roomId]);

  // 플레이어 선택/해제 토글 함수
  const togglePlayer = (memberId) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId); // 이미 있으면 제거
      } else {
        return [...prev, memberId]; // 없으면 추가
      }
    });
  };

  // 게임 시작 (결과 입력 폼으로 이동)
  const handleStartGame = () => {
    if (!selectedGame) {
      alert('보드게임을 먼저 선택해주세요!');
      return;
    }
    if (selectedPlayers.length < 2) {
      alert('게임은 최소 2명 이상 선택해야 합니다!');
      return;
    }

    // 다음 화면(MatchForm.jsx)으로 넘어갈 때 선택한 게임과 플레이어 정보를 state로 넘겨줌
    navigate(`/match-form/${roomId}`, { 
      state: { 
        gameId: selectedGame, 
        players: selectedPlayers 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-32">
      <div className="max-w-md w-full mt-10 space-y-8">
        
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="text-slate-400 font-bold hover:text-slate-700">
            ← 뒤로가기
          </button>
          <h1 className="text-2xl font-black text-slate-900">게임 셋업</h1>
          <div className="w-16"></div>
        </div>

        {/* 1. 보드게임 선택 영역 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 ml-1">어떤 게임 할까?</h2>
          <div className="grid grid-cols-2 gap-4">
            {games.map((game) => (
              <div 
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`p-5 rounded-3xl cursor-pointer flex flex-col items-center justify-center gap-2 border-4 transition-all ${
                  selectedGame === game.id 
                    ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-200' 
                    : 'border-transparent bg-white shadow-sm hover:border-blue-200'
                }`}
              >
                <span className="text-4xl">{game.emoji}</span>
                <span className="font-bold text-slate-800">{game.name}</span>
                <span className="text-xs text-slate-400 font-medium">
                  {game.minPlayer}~{game.maxPlayer}인 추천
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 플레이어 선택 영역 (게임이 선택되어야 활성화 느낌을 줌) */}
        <section className={`space-y-4 transition-opacity ${selectedGame ? 'opacity-100' : 'opacity-50'}`}>
          <h2 className="text-xl font-bold text-slate-800 ml-1">누가 참여해?</h2>
          <div className="bg-white p-2 rounded-3xl shadow-sm space-y-2">
            {members.map((member) => {
              const isSelected = selectedPlayers.includes(member.memberId);
              return (
                <div 
                  key={member.memberId}
                  onClick={() => selectedGame && togglePlayer(member.memberId)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {member.nickname.charAt(0)}
                    </div>
                    <span className="font-bold text-lg">{member.nickname}</span>
                  </div>
                  
                  {/* 체크박스 UI */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-white bg-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <span className="text-blue-600 font-black text-sm">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* 하단 고정: 게임 시작 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent flex justify-center">
        <button 
          onClick={handleStartGame}
          className={`w-full max-w-md py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
            selectedGame && selectedPlayers.length >= 2 
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20 translate-y-0' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed translate-y-2'
          }`}
        >
          {selectedPlayers.length}명 선택 완료! 게임 시작
        </button>
      </div>
    </div>
  );
};

export default GameSelect;