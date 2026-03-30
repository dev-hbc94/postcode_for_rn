# RN Kakao Postcode Library Architecture

## 목표

이 라이브러리는 React Native에서 Kakao 우편번호 서비스를 안정적으로 사용하기 위한 **교체 가능한 wrapper**를 만드는 것을 목표로 한다.
핵심은 외부 서비스의 변경 가능성이 큰 지점을 모두 설정/팩토리/어댑터 레이어로 분리하는 것이다.

## 왜 외부 패키지 의존을 최소화하는가

React Native 쪽 카카오 우편번호 패키지들은 대부분 결국 `react-native-webview` 위에 얇은 래퍼를 얹는 구조다.
따라서 실서비스 관점에서는 다음 항목을 직접 소유하는 편이 안전하다.

1. script URL
2. guide/service domain
3. JS namespace (`kakao.Postcode`, `daum.Postcode` 등)
4. WebView bridge message schema
5. 결과 파싱/주소 조합 규칙
6. telemetry / analytics hook
7. fallback 전략

## 설계 원칙

### 1. 외부 변경 포인트를 전부 주입 가능하게 설계

- `endpoints.scriptUrl`
- `endpoints.fallbackScriptUrls`
- `api.namespaceMode`
- `api.namespaceCandidates`
- `bridge.channel`
- `bridge.schemaVersion`
- `htmlFactory.buildHtml`

즉, 카카오가 다음에 또 도메인/네임스페이스/부트스트랩 방식을 바꾸더라도 앱 코드를 크게 건드리지 않고 라이브러리 설정만 수정하면 되도록 한다.

### 2. React Native에서는 popup보다 embed 우선

WebView 환경에서는 `window.open` 기반 popup보다 `embed(element)`가 안정적이다.
이 라이브러리는 이를 기본 transport로 고정한다.

### 3. bridge는 string 기반의 versioned protocol 사용

React Native WebView는 `window.ReactNativeWebView.postMessage()`를 통해 문자열을 전달한다.
따라서 bridge message는 아래 구조를 기본으로 한다.

```json
{
  "channel": "KAKAO_POSTCODE_BRIDGE",
  "schemaVersion": "1",
  "type": "COMPLETE",
  "payload": {}
}
```

이 구조를 쓰면 이후 이벤트가 늘어나도 호환성 관리가 쉽다.

### 4. Raw data와 Normalized data를 같이 보존

카카오 원본 payload를 그대로 버리지 않고 `raw`로 남긴다.
운영 중 데이터 이슈가 생기면 이 원본이 디버깅에 매우 중요하다.

## 폴더 구조

```text
src/
  bridge.ts              # bridge message 생성/파싱
  defaults.ts            # 기본 config + deep merge
  formatters.ts          # extraAddress 조합 / normalize
  html.ts                # WebView에 넣을 HTML 생성기
  KakaoPostcodeView.tsx  # inline WebView component
  KakaoPostcodeModal.tsx # modal wrapper
  types.ts               # 공개 계약
  index.ts               # 배럴 export
```

## 변경 가능성이 높은 지점과 대응 방법

### A. CDN URL 변경

대응:
- `endpoints.scriptUrl` 외부 주입
- `fallbackScriptUrls` 다중 지원
- 로딩 실패 시 순차 fallback

### B. JS namespace 변경

대응:
- `api.namespaceMode = 'auto'`
- `api.namespaceCandidates = ['kakao.Postcode', 'daum.Postcode']`
- 추후 `window.KakaoPostcode` 같은 신규 namespace가 생기면 후보 배열만 추가

### C. 서비스 도메인 변경

대응:
- `guideUrl`, `serviceUrl` 분리 보관
- 브리지 BOOT 이벤트에 함께 노출
- 내부 모니터링 로그에 남길 수 있도록 설계

### D. 결과 payload shape 변경

대응:
- `NormalizedPostcodeResult`는 앱에서 정말 필요한 최소 필드만 보장
- 나머지는 `raw`로 유지
- 앱이 `raw`에 직접 의존하지 않도록 권장

### E. WebView 동작 차이

대응:
- `webViewProps`를 외부로 열어 둠
- iOS/Android 별 세부 옵션 조정 가능
- 문제가 생기면 `htmlFactory.buildHtml()`로 HTML 전체 override 가능
