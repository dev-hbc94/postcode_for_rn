import type {
  BridgeEventType,
  KakaoPostcodeBridgeConfig,
  KakaoPostcodeBridgeMessage,
  KakaoPostcodeErrorPayload,
  KakaoPostcodeRawResult,
} from './types';

const VALID_BRIDGE_EVENT_TYPES = new Set<string>([
  'BOOT', 'SCRIPT_LOAD_START', 'SCRIPT_LOADED', 'SCRIPT_LOAD_FAILED',
  'NAMESPACE_RESOLVED', 'OPENED', 'RESIZE', 'SEARCH', 'COMPLETE', 'ERROR',
]);

export function createBridgeMessage<T>(
  bridge: KakaoPostcodeBridgeConfig,
  type: BridgeEventType,
  payload?: T,
): KakaoPostcodeBridgeMessage<T> {
  return {
    channel: bridge.channel,
    schemaVersion: bridge.schemaVersion,
    type,
    payload,
  };
}

export type ParseBridgeMessageResult =
  | { ok: true; data: KakaoPostcodeBridgeMessage<unknown>; error?: never }
  | { ok: false; data?: never; error: KakaoPostcodeErrorPayload };

export function parseBridgeMessage(
  raw: string,
  bridge: KakaoPostcodeBridgeConfig,
): ParseBridgeMessageResult {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as Record<string, unknown>).channel !== 'string' ||
      typeof (parsed as Record<string, unknown>).schemaVersion !== 'string' ||
      typeof (parsed as Record<string, unknown>).type !== 'string'
    ) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_PARSE_FAILED',
          message: 'Bridge message is missing required fields.',
          details: parsed,
        },
      };
    }

    const message = parsed as KakaoPostcodeBridgeMessage;

    if (
      message.channel !== bridge.channel ||
      message.schemaVersion !== bridge.schemaVersion
    ) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_PARSE_FAILED',
          message: 'Unexpected bridge channel or schemaVersion.',
          details: message,
        },
      };
    }
    if (__DEV__ && !VALID_BRIDGE_EVENT_TYPES.has(message.type)) {
      console.warn(`[kakao-postcode-rn] Unknown bridge event type: "${message.type}"`);
    }

    return { ok: true, data: message };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_PARSE_FAILED',
        message: 'Failed to parse bridge message.',
        details: error,
      },
    };
  }
}

export function isValidRawResult(value: unknown): value is KakaoPostcodeRawResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.zonecode === 'string' &&
    typeof v.address === 'string' &&
    typeof v.addressType === 'string' &&
    typeof v.userSelectedType === 'string'
  );
}

export function isValidErrorPayload(value: unknown): value is KakaoPostcodeErrorPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === 'string' && typeof v.message === 'string';
}
