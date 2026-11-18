import axios, { AxiosError } from 'axios';
import { getAuthUserId, getNickname } from '../auth/storage';
import { getLanguage, getProfileImage } from '../utils/storage';
import translations from '../i18n/translations/index';
import { handlePracticeRequest } from './practiceServer';

const realAdapter = (config) => axios.getAdapter(axios.defaults.adapter)(config);

const text = (key) => translations[getLanguage()]?.practice?.[key] ?? translations.ko.practice[key];

const parseBody = (data) => {
  if (typeof data !== 'string') return data ?? null;
  try { return JSON.parse(data); } catch { return null; }
};

/** 연습 중 axios 어댑터. 게임 목록 읽기만 실제 서버로 보내고 나머지는 가짜 서버가 답한다. */
export const practiceAdapter = async (config) => {
  const [path, query = ''] = (config.url || '').split('?');
  const params = { ...Object.fromEntries(new URLSearchParams(query)), ...(config.params || {}) };
  const ctx = {
    userId: getAuthUserId(),
    nickname: getNickname() || '?',
    profileImage: getProfileImage(),
    friendNames: text('friendNames').split(','),
    defaultCommunityName: text('communityName'),
    blockedMessage: text('blocked'),
    fetchGame: (id) => realAdapter({ ...config, method: 'get', url: `/games/${id}`, data: undefined, params: undefined })
      .then(r => parseBody(r.data)),
  };
  try {
    const res = await handlePracticeRequest(
      { method: (config.method || 'get').toUpperCase(), path, params, body: parseBody(config.data) },
      ctx,
    );
    // 게임 목록은 실제 서버에서 읽되, 연습 모임 id는 실제 서버에 없으므로 빼고 공식 게임만 받는다
    if (res === null) return realAdapter({ ...config, url: path, params: { ...params, communityId: undefined } });
    return { data: res.data, status: res.status, statusText: 'OK', headers: {}, config, request: null };
  } catch (e) {
    if (!e.practiceStatus) throw e;
    const response = { data: e.practiceData, status: e.practiceStatus, statusText: '', headers: {}, config, request: null };
    throw new AxiosError(e.message, AxiosError.ERR_BAD_REQUEST, config, null, response);
  }
};
