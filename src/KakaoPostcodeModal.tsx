import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KakaoPostcodeView } from './KakaoPostcodeView';
import type { KakaoPostcodeModalProps } from './types';

export function KakaoPostcodeModal({
  visible,
  onClose,
  title = '우편번호 검색',
  closeText = '닫기',
  headerRight,
  modalProps,
  persistWebView = false,
  ...rest
}: KakaoPostcodeModalProps) {
  return (
    <Modal
      animationType="slide"
      {...modalProps}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight}>
            {headerRight}
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeText}>{closeText}</Text>
            </Pressable>
          </View>
        </View>

        {(visible || persistWebView) && <KakaoPostcodeView {...rest} style={[styles.webview, rest.style]} />}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
