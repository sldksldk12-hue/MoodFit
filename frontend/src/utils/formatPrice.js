/** 숫자를 원화 표시용 문자열로 변환합니다. */
export const formatPrice = (value) =>
  `${Number(value ?? 0).toLocaleString()}원`;
