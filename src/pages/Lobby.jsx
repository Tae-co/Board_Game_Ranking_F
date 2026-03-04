import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Lobby = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  // 1. 방 목록 불러오기 (컴포넌트 마운트 시 실행)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const res = await api.get(`/rooms/my/${userId}`);
        setRooms(res.data || []);
      } catch (err) {
        console.error('방 목록을 불러오는데 실패했습니다.', err);
      }
    };
    fetchRooms();
  }, []);

  // 2. 새로운 방 만들기
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('방 이름을 입력해주세요!');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const res = await api.post('/rooms', {
        roomName: newRoomName,
        memberId: Number(userId)
      });
      
      // ⚠️ 수정됨: 백엔드 응답(res.data.id)과 초대 화면 주소(/invite/)에 맞게 수정
      navigate(`/invite/${res.data.id}`); 
    } catch (err) {
      alert('방 생성에 실패했습니다.');
      console.error(err);
    }
  };

  // 3. 기존 방 입장하기
  const handleEnterRoom = (roomId) => {
    navigate(`/invite/${roomId}`);
  };

  // 4. 로그아웃 기능 (새로 추가됨!)
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('userId'); // 저장된 유저 정보 삭제
      localStorage.removeItem('nickname'); 
      navigate('/login'); // 로그인 화면으로 돌려보내기
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8 mt-10">
        
        {/* 헤더 영역 */}
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-slate-900">게임 대기실</h1>
          {/* 로그아웃 버튼으로 변경됨! */}
          <button 
            onClick={handleLogout}
            className="text-slate-400 font-bold hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 새 방 만들기 영역 */}
        <div className="bg-white p-6 rounded-3xl shadow-md space-y-4">
          <h2 className="text-xl font-bold text-slate-800">새로운 그룹 만들기</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="방 이름 (예: 주말 보드게임 팟)"
              className="flex-1 p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold"
              value={newRoomName} 
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <button 
              onClick={handleCreateRoom} 
              className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              만들기
            </button>
          </div>
        </div>

        {/* 방 목록 영역 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 ml-2">참여 중인 그룹</h2>
          
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-200">
              아직 참여 중인 방이 없어요.<br/>새로운 방을 만들어보세요!
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div 
                  key={room.id} 
                  onClick={() => handleEnterRoom(room.id)}
                  className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                    {/* 방 인원수가 백엔드에서 오지 않으면 렌더링 안 하도록 안전하게 처리 */}
                    {room.memberCount && (
                      <p className="text-sm text-slate-500 font-medium mt-1">현재 인원: {room.memberCount}명</p>
                    )}
                  </div>
                  <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold text-sm">
                    입장
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Lobby;