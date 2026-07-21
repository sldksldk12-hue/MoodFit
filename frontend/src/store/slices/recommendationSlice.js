/**
 * 파일: src/store/slices/recommendationSlice.js
 *
 * 역할
 * - AI가 같은 이유로 추천한 상품 그룹을 Redux 전역 상태로 관리합니다.
 */

import { createSlice } from "@reduxjs/toolkit";

/**
 * 추천 목록 초기 상태
 */
const initialState = {
  // 추천 리스트 페이지 제목
  title: "",

  // AI가 추천한 상품 목록
  products: [],

  // 추천 상품 검색에 사용한 키워드
  searchKeyword: "",

  // 추천 시 분석된 감정
  emotion: null,

  // 해당 상품들을 공통으로 추천한 이유
  reason: "",
};

const recommendationSlice = createSlice({
  name: "recommendation",

  initialState,

  reducers: {
    /**
     * 상품 배열만 저장합니다.
     *
     * 기존 코드에서 사용 중일 수 있으므로 유지합니다.
     */
    setRecommendedProducts: (state, action) => {
      state.products = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /**
     * 감정과 추천 이유를 저장합니다.
     *
     * 기존 코드와의 호환을 위해 유지합니다.
     */
    setRecommendationInfo: (state, action) => {
      state.emotion =
        action.payload?.emotion ?? null;

      state.reason =
        action.payload?.reason ?? "";
    },

    /**
     * 같은 추천 이유를 가진 상품 목록을
     * 하나의 추천 그룹으로 저장합니다.
     *
     * ChatPage에서 추천 리스트 페이지로
     * 이동하기 전에 이 액션을 사용합니다.
     */
    setRecommendationGroup: (state, action) => {
      const payload = action.payload ?? {};

      state.title =
        payload.title ?? "AI 추천 상품 리스트";

      state.searchKeyword =
        payload.searchKeyword ?? "";

      state.emotion =
        payload.emotion ?? null;

      state.reason =
        payload.reason ?? "";

      state.products = Array.isArray(
        payload.products
      )
        ? payload.products
        : [];
    },

    /**
     * 추천 제목만 변경합니다.
     */
    setRecommendationTitle: (state, action) => {
      state.title =
        String(action.payload ?? "");
    },

    /**
     * 추천 결과 전체를 초기화합니다.
     */
    clearRecommendation: (state) => {
      state.title = "";
      state.products = [];
      state.searchKeyword = "";
      state.emotion = null;
      state.reason = "";
    },
  },
});

export const {
  setRecommendedProducts,
  setRecommendationInfo,
  setRecommendationGroup,
  setRecommendationTitle,
  clearRecommendation,
} = recommendationSlice.actions;

export default recommendationSlice.reducer;