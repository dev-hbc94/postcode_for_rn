import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';

import { createBridgeMessage, isValidErrorPayload, isValidRawResult, parseBridgeMessage } from './bridge';
import { DEFAULT_KAKAO_POSTCODE_CONFIG, deepMerge } from './defaults';
import { normalizePostcodeResult } from './formatters';
import { buildKakaoPostcodeHtml } from './html';
import type {
  KakaoPostcodeErrorPayload,
  KakaoPostcodeViewProps,
} from './types';

export function KakaoPostcodeView({
  config,
  htmlFactory,
  defaultQuery,
  onComplete,
  onEvent,
  onError,
  style,
  webViewProps,
}: KakaoPostcodeViewProps) {
  // F-09: useMemo 안 직접 변이 제거 — defaultQuery를 deepMerge override에 포함
  const mergedConfig = useMemo(() => {
    return deepMerge(DEFAULT_KAKAO_POSTCODE_CONFIG, {
      ...config,
      ...(defaultQuery !== undefined && {
        search: { ...config?.search, defaultQuery },
      }),
    });
  }, [config, defaultQuery]);

  const html = useMemo(() => {
    if (htmlFactory?.buildHtml) {
      return htmlFactory.buildHtml({ config: mergedConfig });
    }
    return buildKakaoPostcodeHtml({ config: mergedConfig });
  }, [htmlFactory, mergedConfig]);

  // H-02: onComplete/onError/onEvent를 ref로 유지해 stale closure 방지
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onEventRef = useRef(onEvent);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const handleBridgeError = useCallback((error: KakaoPostcodeErrorPayload) => {
    onErrorRef.current?.(error);
    onEventRef.current?.(createBridgeMessage(mergedConfig.bridge, 'ERROR', error));
  }, [mergedConfig.bridge]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    // F-01: discriminated union으로 타입 좁히기
    const result = parseBridgeMessage(event.nativeEvent.data, mergedConfig.bridge);

    if (!result.ok) {
      handleBridgeError(result.error);
      return;
    }

    const parsed = result.data;
    onEventRef.current?.(parsed);

    if (parsed.type === 'COMPLETE' && parsed.payload) {
      // F-02: as any 제거 — isValidRawResult 타입 가드로 런타임 검증
      if (!isValidRawResult(parsed.payload)) {
        handleBridgeError({
          code: 'BRIDGE_PARSE_FAILED',
          message: 'COMPLETE payload is missing required fields.',
          details: parsed.payload,
        });
        return;
      }
      onCompleteRef.current(normalizePostcodeResult(parsed.payload), parsed.payload);
      return;
    }

    if (parsed.type === 'ERROR' && parsed.payload) {
      // H-01: as 캐스팅 제거 — isValidErrorPayload 타입 가드로 런타임 검증
      if (isValidErrorPayload(parsed.payload)) {
        handleBridgeError(parsed.payload);
      } else {
        handleBridgeError({
          code: 'BRIDGE_PARSE_FAILED',
          message: 'ERROR payload has unexpected structure.',
          details: parsed.payload,
        });
      }
    }
  }, [handleBridgeError, mergedConfig.bridge]);

  return (
    <WebView
      {...webViewProps}
      originWhitelist={['*']}
      source={{ html, baseUrl: mergedConfig.endpoints.baseUrl }}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="compatibility"
      androidLayerType="hardware"
      setSupportMultipleWindows={false}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={(request) => {
        const url = request.url ?? '';
        if (!url || url === 'about:blank') return true;
        // dangerous scheme(javascript:, data:, file:)만 차단, HTTP/HTTPS는 모두 허용
        if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('file:') || url.startsWith('blob:')) {
          return false;
        }
        return true;
      }}
      style={style}
    />
  );
}
