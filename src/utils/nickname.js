// 닉네임 허용 문자: 글자(한글·영문 등)·숫자·이모지·띄어쓰기(단어 사이 한 칸만). %·_ 같은 특수문자는 금지.
// 백엔드 Utils/NicknameRules.java 와 같은 규칙을 유지할 것.
const TOKEN = String.raw`(?:\p{Extended_Pictographic}️|[\p{L}\p{M}\p{Nd}\p{Emoji_Presentation}‍\u{E0020}-\u{E007F}])`;
const NICKNAME_PATTERN = new RegExp(`^${TOKEN}+(?: ${TOKEN}+)*$`, 'u');

export const hasOnlyAllowedNicknameChars = (value) => NICKNAME_PATTERN.test(value);
