import type { ReactNode } from 'react';
import type { ModalProps, StyleProp, ViewStyle } from 'react-native';
import type { WebViewProps } from 'react-native-webview';

export type PostcodeNamespaceMode = 'kakao' | 'daum' | 'auto';
export type PostcodeTransportMode = 'embed';
export type BridgeEventType =
  | 'BOOT'
  | 'SCRIPT_LOAD_START'
  | 'SCRIPT_LOADED'
  | 'SCRIPT_LOAD_FAILED'
  | 'NAMESPACE_RESOLVED'
  | 'OPENED'
  | 'RESIZE'
  | 'SEARCH'
  | 'COMPLETE'
  | 'ERROR';

export interface KakaoPostcodeRawResult {
  zonecode: string;
  address: string;
  addressEnglish?: string;
  addressType: 'R' | 'J';
  userSelectedType: 'R' | 'J';
  roadAddress: string;
  jibunAddress: string;
  autoRoadAddress?: string;
  autoJibunAddress?: string;
  bname: string;
  buildingName: string;
  apartment?: 'Y' | 'N';
  sido?: string;
  sigungu?: string;
  sigunguCode?: string;
  roadnameCode?: string;
  roadname?: string;
  query?: string;
  postcode?: string;
}

export interface NormalizedPostcodeResult {
  zonecode: string;
  address: string;
  addressType: 'R' | 'J';
  userSelectedType: 'R' | 'J';
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  extraAddress: string;
  displayAddress: string;
  raw: KakaoPostcodeRawResult;
}

export interface KakaoPostcodeEndpoints {
  baseUrl: string;
  guideUrl: string;
  serviceUrl: string;
  scriptUrl: string;
  fallbackScriptUrls: string[];
}

export interface KakaoPostcodeApiConfig {
  namespaceMode: PostcodeNamespaceMode;
  namespaceCandidates: string[];
  constructorName: string;
}

export interface KakaoPostcodeBridgeConfig {
  channel: string;
  schemaVersion: string;
}

export interface KakaoPostcodeSearchConfig {
  defaultQuery?: string;
  autoClose: boolean;
  maxSuggestItems?: number;
  width: string | number;
  height: string | number;
  animation?: boolean;
  theme?: Record<string, string>;
}

export interface KakaoPostcodeFallbackConfig {
  enableLegacyScriptFallback: boolean;
  enableLegacyNamespaceFallback: boolean;
  scriptLoadTimeoutMs: number;
}

export interface KakaoPostcodeRuntimeConfig {
  endpoints: KakaoPostcodeEndpoints;
  api: KakaoPostcodeApiConfig;
  bridge: KakaoPostcodeBridgeConfig;
  search: KakaoPostcodeSearchConfig;
  fallback: KakaoPostcodeFallbackConfig;
}

export interface KakaoPostcodeBridgeMessage<T = unknown> {
  channel: string;
  schemaVersion: string;
  type: BridgeEventType;
  payload?: T;
}

export interface KakaoPostcodeErrorPayload {
  code:
    | 'SCRIPT_LOAD_FAILED'
    | 'NAMESPACE_NOT_FOUND'
    | 'POSTCODE_INIT_FAILED'
    | 'BRIDGE_PARSE_FAILED'
    | 'UNEXPECTED_NAVIGATION';
  message: string;
  details?: unknown;
}

export interface KakaoPostcodeHtmlBuildContext {
  config: KakaoPostcodeRuntimeConfig;
}

export interface KakaoPostcodeHtmlFactory {
  buildHtml?: (context: KakaoPostcodeHtmlBuildContext) => string;
}

export interface KakaoPostcodeViewProps {
  config?: DeepPartial<KakaoPostcodeRuntimeConfig>;
  htmlFactory?: KakaoPostcodeHtmlFactory;
  style?: StyleProp<ViewStyle>;
  defaultQuery?: string;
  onComplete: (
    normalized: NormalizedPostcodeResult,
    raw: KakaoPostcodeRawResult,
  ) => void;
  onEvent?: (message: KakaoPostcodeBridgeMessage) => void;
  onError?: (error: KakaoPostcodeErrorPayload) => void;
  webViewProps?: Omit<
    WebViewProps,
    | 'source'
    | 'onMessage'
    | 'originWhitelist'
    | 'javaScriptEnabled'
    | 'domStorageEnabled'
    | 'onShouldStartLoadWithRequest'
  >;
}

export interface KakaoPostcodeModalProps extends KakaoPostcodeViewProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  closeText?: string;
  headerRight?: ReactNode;
  modalProps?: Omit<ModalProps, 'visible' | 'onRequestClose'>;
  /**
   * true이면 visible=false일 때도 WebView를 언마운트하지 않습니다.
   * 모달을 다시 열 때 카카오 스크립트 재로드를 방지하고 싶은 경우 사용합니다.
   * 기본값: false (visible=false이면 언마운트)
   */
  persistWebView?: boolean;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<unknown>
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};
