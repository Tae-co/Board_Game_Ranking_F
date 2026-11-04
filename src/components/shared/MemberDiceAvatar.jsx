import { getAvatarColorById, getAvatarColorByStr } from '../../utils/avatarUtils';
import DiceAvatar from './DiceAvatar';

/**
 * 매장 화면의 사용자 아바타. 매장에서는 프로필 사진을 쓰지 않고 늘 기본(주사위) 아바타를 쓴다.
 * 색은 memberId로 고르고, memberId가 없으면(탈퇴·방금 끝난 경기) 닉네임으로 고른다.
 */
const MemberDiceAvatar = ({ memberId, nickname, size }) => (
  <span style={{
    width: size, height: size, borderRadius: 999, flexShrink: 0,
    backgroundColor: memberId != null ? getAvatarColorById(memberId) : getAvatarColorByStr(nickname),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <DiceAvatar size={size} />
  </span>
);

export default MemberDiceAvatar;
