import translations from '../i18n/translations/index';
import { getLanguage } from './storage';

// 닉네임 허용 문자: 글자(한글·영문 등)·숫자·이모지·띄어쓰기(단어 사이 한 칸만). %·_ 같은 특수문자는 금지.
// 백엔드 Utils/NicknameRules.java 와 같은 규칙을 유지할 것.
const TOKEN = String.raw`(?:\p{Extended_Pictographic}️|[\p{L}\p{M}\p{Nd}\p{Emoji_Presentation}‍\u{E0020}-\u{E007F}])`;
const NICKNAME_PATTERN = new RegExp(`^${TOKEN}+(?: ${TOKEN}+)*$`, 'u');

export const hasOnlyAllowedNicknameChars = (value) => NICKNAME_PATTERN.test(value);

// 방·커뮤니티를 나간 사람의 기록은 서버에서 '나간 멤버 #<id>'로 남는다. 화면 언어로 바꿔 보여 준다.
const LEFT_MEMBER_PREFIX = '나간 멤버 #';

export const localizeNickname = (nickname) => {
  if (typeof nickname !== 'string' || !nickname.startsWith(LEFT_MEMBER_PREFIX)) return nickname;
  const label = translations[getLanguage()]?.common?.leftMember ?? translations.ko.common.leftMember;
  return `${label} #${nickname.slice(LEFT_MEMBER_PREFIX.length)}`;
};

// 응답 배열의 nickname(과 participants[].nickname)을 바꾼다
export const localizeNicknames = (list) => Array.isArray(list)
  ? list.map(item => ({
      ...item,
      ...(item?.nickname !== undefined && { nickname: localizeNickname(item.nickname) }),
      ...(Array.isArray(item?.participants) && {
        participants: item.participants.map(p => ({ ...p, nickname: localizeNickname(p.nickname) })),
      }),
    }))
  : list;
