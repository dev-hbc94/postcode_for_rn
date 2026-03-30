# Kakao Postcode RN Implementation Guide

## 1. 설치

```bash
# npm
npm install @dev-hbc94/postcode_for_rn react-native-webview

# yarn
yarn add @dev-hbc94/postcode_for_rn react-native-webview
```

GitHub에서 직접 설치하거나 특정 버전을 고정할 경우:

```bash
npm install github:dev-hbc94/kakao-postcode-rn-design#v1.0.0
```

## 2. 가장 먼저 결정할 정책

### 저장 필드 권장안

```ts
type AddressValue = {
  zonecode: string;
  address: string;        // 표시용 주소
  detailAddress: string;  // 사용자가 입력
  extraAddress: string;   // 참고항목
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J' | '';
};
```

### 앱 정책

- 우편번호 검색 결과는 기본주소까지만 채운다.
- 상세주소는 반드시 RN TextInput으로 별도 입력받는다.
- 앱은 `displayAddress`를 사용자에게 보여주고, 저장 시 `roadAddress`, `jibunAddress`도 같이 보관한다.

## 3. 기본 사용 예시

```tsx
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { KakaoPostcodeModal } from '@dev-hbc94/postcode_for_rn';
import type { NormalizedPostcodeResult, KakaoPostcodeRawResult } from '@dev-hbc94/postcode_for_rn';

type AddressForm = {
  zonecode: string;
  address: string;
  detailAddress: string;
  extraAddress: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J' | '';
};

export default function AddressFormScreen() {
  const [visible, setVisible] = useState(false);
  const detailRef = useRef<TextInput>(null);
  const [form, setForm] = useState<AddressForm>({
    zonecode: '',
    address: '',
    detailAddress: '',
    extraAddress: '',
    roadAddress: '',
    jibunAddress: '',
    userSelectedType: '',
  });

  const handleComplete = (result: NormalizedPostcodeResult, _raw: KakaoPostcodeRawResult) => {
    setForm((prev) => ({
      ...prev,
      zonecode: result.zonecode,
      address: result.displayAddress,
      extraAddress: result.extraAddress,
      roadAddress: result.roadAddress,
      jibunAddress: result.jibunAddress,
      userSelectedType: result.userSelectedType,
      detailAddress: '',
    }));

    setVisible(false);
    setTimeout(() => detailRef.current?.focus(), 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>우편번호</Text>
      <View style={styles.row}>
        <TextInput value={form.zonecode} editable={false} style={[styles.input, styles.zip]} />
        <Pressable style={styles.button} onPress={() => setVisible(true)}>
          <Text style={styles.buttonText}>우편번호 찾기</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>주소</Text>
      <TextInput value={form.address} editable={false} style={styles.input} />

      <Text style={styles.label}>상세주소</Text>
      <TextInput
        ref={detailRef}
        value={form.detailAddress}
        onChangeText={(text) => setForm((prev) => ({ ...prev, detailAddress: text }))}
        style={styles.input}
      />

      <KakaoPostcodeModal
        visible={visible}
        onClose={() => setVisible(false)}
        onComplete={handleComplete}
        onError={(error) => {
          console.warn('postcode error', error);
        }}
        onEvent={(event) => {
          if (event.type === 'ERROR') {
            console.log('postcode telemetry', event.payload);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { marginTop: 12, marginBottom: 6, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12 },
  zip: { flex: 0, width: 120 },
  button: { height: 48, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#111827', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

## 4. 서비스 변경에 유연하게 대응하는 사용법

### A. scriptUrl / namespace를 원격 설정으로 제어

```tsx
<KakaoPostcodeModal
  visible={visible}
  onClose={() => setVisible(false)}
  onComplete={handleComplete}
  config={{
    endpoints: {
      scriptUrl: remoteConfig.postcodeScriptUrl,
      fallbackScriptUrls: remoteConfig.postcodeFallbackScriptUrls,
    },
    api: {
      namespaceMode: remoteConfig.postcodeNamespaceMode,
      namespaceCandidates: remoteConfig.postcodeNamespaceCandidates,
    },
  }}
/>
```

권장 remote config 키 예시:

```text
postcodeScriptUrl
postcodeFallbackScriptUrls
postcodeNamespaceMode
postcodeNamespaceCandidates
postcodeGuideUrl
postcodeServiceUrl
```

### B. 카카오가 초기화 방식을 바꾸면

`htmlFactory.buildHtml()`만 교체한다.
기존 컴포넌트 API는 유지한 채 내부 부트스트랩만 교체할 수 있다.

```tsx
<KakaoPostcodeModal
  visible={visible}
  onClose={() => setVisible(false)}
  onComplete={handleComplete}
  htmlFactory={{
    buildHtml: ({ config }) => {
      return `<!DOCTYPE html><html><body><div id="app"></div><script>/* custom bootstrap */</script></body></html>`;
    },
  }}
/>
```

## 5. 운영 시 꼭 붙일 것

### telemetry

bridge event를 로그로 남겨라.

```ts
onEvent={(event) => {
  analytics.track('postcode_event', {
    type: event.type,
    payload: event.payload,
  });
}}
```

최소 수집 추천 이벤트:
- `SCRIPT_LOAD_FAILED`
- `NAMESPACE_RESOLVED`
- `ERROR`
- `COMPLETE`

### fallback alert

다음 조건이면 앱 알림 또는 대시보드 경고를 띄워라.

- `SCRIPT_LOAD_FAILED` 급증
- `NAMESPACE_NOT_FOUND` 발생
- `COMPLETE` 성공률 급락

