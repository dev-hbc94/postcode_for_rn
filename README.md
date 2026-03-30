# @dev-hbc94/postcode_for_rn

React Native에서 카카오 우편번호 서비스를 안정적으로 사용하기 위한 WebView wrapper 라이브러리.

- `kakao.Postcode` / `daum.Postcode` namespace 자동 감지 및 fallback
- CDN URL, namespace, HTML 생성기 모두 외부 주입 가능
- WebView bridge message versioning 지원
- raw 결과 + normalized 결과 동시 제공
- TypeScript 완전 지원

---

## 설치

```bash
# npm
npm install @dev-hbc94/postcode_for_rn react-native-webview

# yarn
yarn add @dev-hbc94/postcode_for_rn react-native-webview
```

GitHub에서 직접 설치하거나 특정 버전을 고정할 경우:

```bash
npm install github:dev-hbc94/postcode_for_rn#v0.1.0
```

### Peer Dependencies

| 패키지                 | 버전    |
| ---------------------- | ------- |
| `react`                | >= 18   |
| `react-native`         | >= 0.73 |
| `react-native-webview` | >= 13   |

---

## 빠른 시작

### Modal 방식 (권장)

```tsx
import React, { useState } from "react";
import { Button } from "react-native";
import { KakaoPostcodeModal } from "@dev-hbc94/postcode_for_rn";
import type {
  NormalizedPostcodeResult,
  KakaoPostcodeRawResult,
} from "@dev-hbc94/postcode_for_rn";

export default function AddressScreen() {
  const [visible, setVisible] = useState(false);

  // raw: 카카오 API 원본 응답 (두 번째 인자, 선택적으로 활용)
  const handleComplete = (
    result: NormalizedPostcodeResult,
    raw: KakaoPostcodeRawResult,
  ) => {
    console.log(result.zonecode); // '06232'
    console.log(result.displayAddress); // '강남대로 396 (역삼동, 삼성빌딩)'
    console.log(raw.roadAddress); // 카카오 API 원본 도로명 주소
    setVisible(false);
  };

  return (
    <>
      <Button title="주소 검색" onPress={() => setVisible(true)} />
      <KakaoPostcodeModal
        visible={visible}
        onClose={() => setVisible(false)}
        onComplete={handleComplete}
      />
    </>
  );
}
```

### View 방식 (화면 내 임베드)

```tsx
import React from "react";
import { KakaoPostcodeView } from "@dev-hbc94/postcode_for_rn";
import type {
  NormalizedPostcodeResult,
  KakaoPostcodeRawResult,
} from "@dev-hbc94/postcode_for_rn";

export default function AddressScreen() {
  // raw: 카카오 API 원본 응답 (두 번째 인자, 선택적으로 활용)
  const handleComplete = (
    result: NormalizedPostcodeResult,
    raw: KakaoPostcodeRawResult,
  ) => {
    console.log(result.displayAddress);
    console.log(raw.roadAddress); // 카카오 API 원본 도로명 주소
  };

  return <KakaoPostcodeView style={{ flex: 1 }} onComplete={handleComplete} />;
}
```

전체 예시는 [`examples/AddressFormScreen.tsx`](./examples/AddressFormScreen.tsx) 참고.

---

## Props

### `KakaoPostcodeView`

| Prop           | 타입                                        | 필수 | 기본값      | 설명                     |
| -------------- | ------------------------------------------- | :--: | ----------- | ------------------------ |
| `onComplete`   | `(normalized, raw) => void`                 |  O   |             | 주소 선택 완료 콜백      |
| `config`       | `DeepPartial<KakaoPostcodeRuntimeConfig>`   |      | 기본값 참고 | 세부 설정 override       |
| `htmlFactory`  | `KakaoPostcodeHtmlFactory`                  |      |             | HTML 생성기 커스터마이징 |
| `defaultQuery` | `string`                                    |      | `''`        | 초기 검색어              |
| `style`        | `ViewStyle`                                 |      |             | WebView 컨테이너 스타일  |
| `onEvent`      | `(msg: KakaoPostcodeBridgeMessage) => void` |      |             | 모든 bridge 이벤트 수신  |
| `onError`      | `(err: KakaoPostcodeErrorPayload) => void`  |      |             | 에러 콜백                |
| `webViewProps` | `WebViewProps` (일부 제외)                  |      |             | WebView 추가 props       |

### `KakaoPostcodeModal`

`KakaoPostcodeView`의 모든 props + 아래 추가:

| Prop             | 타입                     | 필수 | 기본값            | 설명                                                                                                                    |
| ---------------- | ------------------------ | :--: | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `visible`        | `boolean`                |  O   |                   | 모달 표시 여부                                                                                                          |
| `onClose`        | `() => void`             |  O   |                   | 모달 닫기 콜백                                                                                                          |
| `title`          | `string`                 |      | `'우편번호 검색'` | 헤더 타이틀                                                                                                             |
| `closeText`      | `string`                 |      | `'닫기'`          | 닫기 버튼 텍스트                                                                                                        |
| `headerRight`    | `ReactNode`              |      |                   | 헤더 우측 커스텀 영역                                                                                                   |
| `modalProps`     | `ModalProps` (일부 제외) |      |                   | RN Modal 추가 props                                                                                                     |
| `persistWebView` | `boolean`                |      | `false`           | `visible=false`일 때도 WebView를 언마운트하지 않음. 자주 열고 닫는 경우 스크립트 재로드를 방지하지만 메모리를 더 사용함 |

---

## 결과 타입

### `NormalizedPostcodeResult`

`onComplete` 첫 번째 인자로 전달되는 정규화된 결과.

| 필드               | 타입                     | 설명                                              |
| ------------------ | ------------------------ | ------------------------------------------------- |
| `zonecode`         | `string`                 | 우편번호 (5자리)                                  |
| `address`          | `string`                 | 사용자가 선택한 주소                              |
| `displayAddress`   | `string`                 | `address (extraAddress)` 형태의 표시용 주소       |
| `roadAddress`      | `string`                 | 도로명 주소                                       |
| `jibunAddress`     | `string`                 | 지번 주소                                         |
| `extraAddress`     | `string`                 | 참고 항목 — 동·건물명 등 (도로명 선택 시만)       |
| `detailAddress`    | `string`                 | 상세주소 (앱에서 직접 입력받아야 함, 기본값 `''`) |
| `addressType`      | `'R' \| 'J'`             | 기본 주소 타입                                    |
| `userSelectedType` | `'R' \| 'J'`             | 사용자가 실제 선택한 주소 타입                    |
| `raw`              | `KakaoPostcodeRawResult` | 카카오 API 원본 응답                              |

---

## 설정 커스터마이징

`config` prop으로 필요한 항목만 override할 수 있습니다.

```tsx
<KakaoPostcodeView
  config={{
    search: {
      autoClose: false,
      maxSuggestItems: 10,
      animation: true,
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#222222",
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FAFAFA",
        textColor: "#333333",
        queryTextColor: "#222222",
        postcodeTextColor: "#FA4256",
        emphTextColor: "#008BD3",
        outlineColor: "#E0E0E0",
      },
    },
    fallback: {
      scriptLoadTimeoutMs: 15000,
    },
  }}
  onComplete={handleComplete}
/>
```

### 주요 기본값

| 설정                                  | 기본값   | 설명                                            |
| ------------------------------------- | -------- | ----------------------------------------------- |
| `api.namespaceMode`                   | `'auto'` | namespace 감지 모드 (`kakao` / `daum` / `auto`) |
| `search.autoClose`                    | `true`   | 주소 선택 후 자동 닫기                          |
| `search.maxSuggestItems`              | `5`      | 자동완성 최대 항목 수                           |
| `fallback.enableLegacyScriptFallback` | `true`   | daum CDN fallback 활성화                        |
| `fallback.scriptLoadTimeoutMs`        | `10000`  | 스크립트 로드 타임아웃 (ms)                     |

---

## 이벤트 처리

```tsx
<KakaoPostcodeView
  onComplete={handleComplete}
  onEvent={(event) => {
    // event.type:
    // 'BOOT' | 'SCRIPT_LOAD_START' | 'SCRIPT_LOADED' | 'SCRIPT_LOAD_FAILED'
    // 'NAMESPACE_RESOLVED' | 'OPENED' | 'RESIZE' | 'SEARCH' | 'COMPLETE' | 'ERROR'
    console.log(event.type, event.payload);
  }}
  onError={(error) => {
    // error.code:
    // 'SCRIPT_LOAD_FAILED' | 'NAMESPACE_NOT_FOUND' | 'POSTCODE_INIT_FAILED'
    // 'BRIDGE_PARSE_FAILED' | 'UNEXPECTED_NAVIGATION'
    console.warn(error.code, error.message);
  }}
/>
```

---

## HTML 생성기 커스터마이징

카카오가 초기화 방식을 변경하는 등 내부 HTML을 완전히 교체해야 할 경우 `htmlFactory`를 사용합니다.

```tsx
<KakaoPostcodeView
  htmlFactory={{
    buildHtml: ({ config }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <!-- 커스텀 부트스트랩 -->
        </body>
      </html>
    `,
  }}
  onComplete={handleComplete}
/>
```

---

## 문서

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 설계 원칙 및 내부 구조
- [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) — 앱 적용 상세 가이드
- [`examples/AddressFormScreen.tsx`](./examples/AddressFormScreen.tsx) — 주소 입력 폼 전체 예시

---

## 기여

[`CONTRIBUTING.md`](./CONTRIBUTING.md)를 참고해주세요.

## 라이센스

[MIT](./LICENSE)
