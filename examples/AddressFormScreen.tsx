import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { KakaoPostcodeModal } from '../src';
import type { NormalizedPostcodeResult, KakaoPostcodeRawResult } from '../src';

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
      detailAddress: '',
      extraAddress: result.extraAddress,
      roadAddress: result.roadAddress,
      jibunAddress: result.jibunAddress,
      userSelectedType: result.userSelectedType,
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
        onError={(error) => console.warn(error)}
        onEvent={(event) => console.log(event)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  zip: {
    flex: 0,
    width: 120,
  },
  button: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#111827',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
