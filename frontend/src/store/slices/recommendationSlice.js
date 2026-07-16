/**
 * 파일: src/store/slices/recommendationSlice.js
 * 분류: 전역 상태 관리 모듈
 *
 * 역할
 * - AI 추천 상품과 추천 근거를 Redux 전역 상태로 관리합니다.
 *
 * 사용 기술
 * - Redux Toolkit createSlice, payload 검증
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
/*
  AI 추천 결과 전역 상태 관리

  사용 기술:
  - Redux Toolkit createSlice
  - optional chaining(?.)
  - null 병합 연산자(??)
  - Array.isArray를 이용한 데이터 검증

  사용하는 이유:
  ChatPage에서 받은 추천 결과를
  RecomendList, 상품 카드, 상세 페이지 등에서 공유하기 위해서다.
*/

// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { createSlice } from "@reduxjs/toolkit";

const recommendationSlice = createSlice({
  // action type과 Redux DevTools에서 사용하는 Slice 이름
  name: "recommendation",

  /*
    추천 관련 초기 상태
  */
  initialState: {
    // AI가 추천한 상품 목록
    products: [],

    // 추천 시 분석된 감정
    emotion: null,

    // AI가 해당 상품을 추천한 이유
    reason: "",
  },

  reducers: {
    /*
      추천 상품 목록 저장

      payload가 배열인지 확인한 후 저장한다.
      배열이 아니면 빈 배열로 바꿔
      map 사용 시 발생할 수 있는 오류를 방지한다.
    */
    setRecommendedProducts: (
      state,
      action
    ) => {
      state.products = Array.isArray(
        action.payload
      )
        ? action.payload
        : [];
    },

    /*
      추천에 사용된 감정과 이유 저장

      optional chaining으로 payload가 없어도
      프로그램이 중단되지 않도록 한다.
    */
    setRecommendationInfo: (
      state,
      action
    ) => {
      state.emotion =
        action.payload?.emotion ?? null;

      state.reason =
        action.payload?.reason ?? "";
    },

    /*
      추천 결과 초기화

      새로운 추천을 시작하거나 로그아웃할 때 사용할 수 있다.
    */
    clearRecommendation: (state) => {
      state.products = [];
      state.emotion = null;
      state.reason = "";
    },
  },
});

/*
  createSlice가 생성한 action 함수 export

  사용 예:
  dispatch(setRecommendedProducts(products));
  dispatch(setRecommendationInfo({ emotion, reason }));
  dispatch(clearRecommendation());
*/
export const {
  setRecommendedProducts,
  setRecommendationInfo,
  clearRecommendation,
} = recommendationSlice.actions;

// store.js에 연결할 reducer export
export default recommendationSlice.reducer;
