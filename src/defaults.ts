import type { DeepPartial, KakaoPostcodeRuntimeConfig } from './types';

export const DEFAULT_KAKAO_POSTCODE_CONFIG: KakaoPostcodeRuntimeConfig = {
  endpoints: {
    baseUrl: 'https://postcode.map.kakao.com',
    guideUrl: 'https://postcode.map.kakao.com/guide',
    serviceUrl: 'https://postcode.map.kakao.com',
    scriptUrl:
      'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js',
    fallbackScriptUrls: [
      'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js',
    ],
  },
  api: {
    namespaceMode: 'auto',
    namespaceCandidates: ['kakao.Postcode', 'daum.Postcode'],
    constructorName: 'Postcode',
  },
  bridge: {
    channel: 'KAKAO_POSTCODE_BRIDGE',
    schemaVersion: '1',
  },
  search: {
    autoClose: true,
    defaultQuery: '',
    maxSuggestItems: 5,
    width: '100%',
    height: '100%',
    animation: false,
    theme: {},
  },
  fallback: {
    enableLegacyScriptFallback: true,
    enableLegacyNamespaceFallback: true,
    scriptLoadTimeoutMs: 10000,
  },
};

/**
 * base 객체와 override 객체를 깊게 병합합니다.
 *
 * - override의 값이 `undefined` 또는 `null`인 경우 base 값이 그대로 유지됩니다.
 *   즉, `null`은 `undefined`와 동일하게 처리되며 base 값을 `null`로 덮어쓸 수 없습니다.
 * - 배열은 깊은 병합 없이 override 값으로 완전히 교체됩니다.
 * - 중첩 객체는 재귀적으로 병합됩니다.
 */
export function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;

  const output = (
    Array.isArray(base)
      ? [...(base as unknown as unknown[])]
      : { ...(base as Record<string, unknown>) }
  ) as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;

    const current = (output as Record<string, unknown>)[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current !== null &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      (output as Record<string, unknown>)[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      (output as Record<string, unknown>)[key] = value;
    }
  }

  return output as T;
}
