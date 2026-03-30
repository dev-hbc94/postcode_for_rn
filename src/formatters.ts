import type {
  KakaoPostcodeRawResult,
  NormalizedPostcodeResult,
} from './types';

export function buildExtraAddress(data: KakaoPostcodeRawResult): string {
  if (data.userSelectedType !== 'R') return '';

  let extra = '';

  if (data.bname && /[동로가]$/.test(data.bname)) {
    extra += data.bname;
  }

  if (data.buildingName && data.apartment === 'Y') {
    extra += extra ? `, ${data.buildingName}` : data.buildingName;
  }

  return extra;
}

export function normalizePostcodeResult(
  data: KakaoPostcodeRawResult,
): NormalizedPostcodeResult {
  const extraAddress = buildExtraAddress(data);
  const address =
    data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
  const displayAddress = extraAddress ? `${address} (${extraAddress})` : address;

  return {
    zonecode: data.zonecode,
    address,
    addressType: data.addressType,
    userSelectedType: data.userSelectedType,
    roadAddress: data.roadAddress || data.autoRoadAddress || '',
    jibunAddress: data.jibunAddress || data.autoJibunAddress || '',
    detailAddress: '',
    extraAddress,
    displayAddress,
    raw: data,
  };
}
