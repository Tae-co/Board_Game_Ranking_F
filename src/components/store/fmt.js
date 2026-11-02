/** 번역 문구의 {name} 자리를 채운다. 같은 자리가 여러 번 나와도 전부 */
export const fmt = (text, vars = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v ?? ''), text ?? '');

/** 1,480 처럼 */
export const num = (n) => (n == null ? '' : Number(n).toLocaleString());
